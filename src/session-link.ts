import { MissionSchema, type Mission } from "./domain/mission"

export const MAX_SESSION_PAYLOAD_CHARS = 64_000
const MAX_SESSION_JSON_BYTES = 128_000
const SESSION_FRAGMENT_KEY = "session"

type CreateSessionUrlParams = {
  mission: Mission
  pageUrl: string
}

type ReadSessionUrlParams = {
  url: string | URL
}

export type SessionUrlReadResult =
  | { type: "none" }
  | { type: "invalid" }
  | { mission: Mission; type: "loaded" }

const bytesToBase64Url = (bytes: Uint8Array) => {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "")
}

const base64UrlToBytes = (value: string) => {
  if (
    value === "" ||
    value.length % 4 === 1 ||
    !/^[A-Za-z0-9_-]+$/u.test(value)
  )
    throw new Error("Invalid base64url payload")

  const base64 = value.replaceAll("-", "+").replaceAll("_", "/")
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  if (bytesToBase64Url(bytes) !== value)
    throw new Error("Non-canonical base64url payload")
  return bytes
}

const ownedBytes = (bytes: Uint8Array): Uint8Array<ArrayBuffer> =>
  Uint8Array.from(bytes)

const gzip = async (bytes: Uint8Array) => {
  const stream = new CompressionStream("gzip")
  const output = new Response(stream.readable).arrayBuffer()
  const writer = stream.writable.getWriter()
  await writer.write(ownedBytes(bytes))
  await writer.close()
  return new Uint8Array(await output)
}

const gunzip = async (bytes: Uint8Array) => {
  const input = new Response(ownedBytes(bytes)).body
  if (input === null) throw new Error("Session stream is unavailable")
  const reader = input
    .pipeThrough(new DecompressionStream("gzip"))
    .getReader()
  const chunks: Uint8Array[] = []
  let byteLength = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    byteLength += value.byteLength
    if (byteLength > MAX_SESSION_JSON_BYTES) {
      await reader.cancel()
      throw new Error("Decompressed session is too large")
    }
    chunks.push(value)
  }

  const result = new Uint8Array(byteLength)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.byteLength
  }
  return result
}

export const toSessionUrl = async ({
  mission,
  pageUrl,
}: CreateSessionUrlParams): Promise<string> => {
  const json = JSON.stringify(mission)
  const payload = bytesToBase64Url(
    await gzip(new TextEncoder().encode(json)),
  )
  if (payload.length > MAX_SESSION_PAYLOAD_CHARS)
    throw new Error("Session is too large to share in a URL")

  const url = new URL(pageUrl)
  url.hash = new URLSearchParams({ [SESSION_FRAGMENT_KEY]: payload }).toString()
  return url.toString()
}

export const readSessionUrl = async ({
  url: source,
}: ReadSessionUrlParams): Promise<SessionUrlReadResult> => {
  const url = typeof source === "string" ? new URL(source) : source
  const payload = new URLSearchParams(url.hash.slice(1)).get(
    SESSION_FRAGMENT_KEY,
  )
  if (payload === null) return { type: "none" }
  if (payload.length > MAX_SESSION_PAYLOAD_CHARS) return { type: "invalid" }

  try {
    const compressed = base64UrlToBytes(payload)
    if (compressed[0] !== 0x1f || compressed[1] !== 0x8b)
      return { type: "invalid" }
    const json = new TextDecoder("utf-8", { fatal: true }).decode(
      await gunzip(compressed),
    )
    const parsed = MissionSchema.safeParse(JSON.parse(json))
    return parsed.success
      ? { mission: parsed.data, type: "loaded" }
      : { type: "invalid" }
  } catch {
    return { type: "invalid" }
  }
}

export const withoutSessionFragment = (source: string | URL) => {
  const url = typeof source === "string" ? new URL(source) : new URL(source)
  url.hash = ""
  return `${url.pathname}${url.search}`
}
