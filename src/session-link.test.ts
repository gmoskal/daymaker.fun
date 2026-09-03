import { describe, expect, it } from "vitest"

import { SEED_MISSION } from "./domain/seed"
import {
  MAX_SESSION_PAYLOAD_CHARS,
  readSessionUrl,
  toSessionUrl,
} from "./session-link"

const base64UrlBytes = (value: string) => {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/")
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0))
}

describe("portable session links", () => {
  it("round-trips the complete Unicode mission through gzip and base64url", async () => {
    const mission = {
      ...SEED_MISSION,
      title: "Baška Voda — coffee ☕",
    }
    const link = await toSessionUrl({
      mission,
      pageUrl: "https://sidequest.example/schedule",
    })
    const url = new URL(link)
    const payload = new URLSearchParams(url.hash.slice(1)).get("session")

    expect(url.pathname).toBe("/schedule")
    expect(url.search).toBe("")
    expect(payload).toMatch(/^[A-Za-z0-9_-]+$/)
    expect([...base64UrlBytes(payload ?? "").slice(0, 2)]).toEqual([0x1f, 0x8b])
    await expect(readSessionUrl({ url })).resolves.toEqual({
      mission,
      type: "loaded",
    })
  })

  it("is deterministic for the same mission and route", async () => {
    const input = {
      mission: SEED_MISSION,
      pageUrl: "https://sidequest.example/needs",
    }

    await expect(toSessionUrl(input)).resolves.toBe(await toSessionUrl(input))
  })

  it("rejects malformed, oversized, and schema-invalid payloads", async () => {
    await expect(
      readSessionUrl({ url: "https://sidequest.example/needs#session=%25" }),
    ).resolves.toEqual({ type: "invalid" })
    await expect(
      readSessionUrl({
        url: `https://sidequest.example/needs#session=${"a".repeat(MAX_SESSION_PAYLOAD_CHARS + 1)}`,
      }),
    ).resolves.toEqual({ type: "invalid" })

    const invalidSchema = await toSessionUrl({
      mission: {
        ...SEED_MISSION,
        schemaVersion: 2,
      } as unknown as typeof SEED_MISSION,
      pageUrl: "https://sidequest.example/needs",
    })
    await expect(readSessionUrl({ url: invalidSchema })).resolves.toEqual({
      type: "invalid",
    })
  })

  it("ignores URLs without a shared session", async () => {
    await expect(
      readSessionUrl({ url: "https://sidequest.example/needs" }),
    ).resolves.toEqual({ type: "none" })
  })
})
