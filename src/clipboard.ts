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
  const copied = target.execCommand("copy")
  field.remove()
  if (!copied) throw new Error("Clipboard copy was rejected")
}

export const copyText = (
  value: string,
  environment: ClipboardEnvironment = {
    clipboard: navigator.clipboard,
    document,
  },
) => {
  if (environment.clipboard === undefined) {
    try {
      fallbackCopy(value, environment.document)
      return Promise.resolve()
    } catch (error) {
      return Promise.reject(error)
    }
  }

  return environment.clipboard
    .writeText(value)
    .catch(() => fallbackCopy(value, environment.document))
}
