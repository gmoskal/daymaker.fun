type ClipboardEnvironment = {
  clipboard?: Pick<Clipboard, "writeText">
  document: Pick<Document, "body" | "createElement" | "execCommand">
}

const fallbackCopy = (value: string, target: ClipboardEnvironment["document"]) => {
  const field = target.createElement("textarea")
  field.value = value
  field.setAttribute("readonly", "")
  field.style.position = "fixed"
  field.style.top = "0"
  field.style.left = "0"
  field.style.opacity = "0"
  field.style.pointerEvents = "none"
  target.body.append(field)
  field.select()
  let copied = false
  try {
    copied = target.execCommand("copy")
  } finally {
    field.remove()
  }
  if (!copied) throw new Error("Clipboard copy was rejected")
}

export const copyText = async (
  value: string,
  environment: ClipboardEnvironment = {
    clipboard: navigator.clipboard,
    document,
  },
) => {
  let fallbackCopied = false
  let fallbackError: unknown = new Error("Clipboard copy was rejected")
  try {
    fallbackCopy(value, environment.document)
    fallbackCopied = true
  } catch (error) {
    fallbackError = error
  }

  if (environment.clipboard !== undefined)
    try {
      await environment.clipboard.writeText(value)
      return
    } catch (error) {
      if (!fallbackCopied) throw error
    }

  if (!fallbackCopied) throw fallbackError
}
