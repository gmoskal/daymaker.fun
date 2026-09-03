import { describe, expect, it, vi } from "vitest"

import { copyText } from "./clipboard"

describe("clipboard", () => {
  it("uses the modern clipboard when it is available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)

    await copyText("current prompt", { clipboard: { writeText }, document })

    expect(writeText).toHaveBeenCalledExactlyOnceWith("current prompt")
  })

  it("copies synchronously when the local mobile origin has no Clipboard API", async () => {
    const execCommand = vi.fn().mockReturnValue(true)

    await copyText("local prompt", {
      document: { body: document.body, createElement: document.createElement.bind(document), execCommand },
    })

    expect(execCommand).toHaveBeenCalledExactlyOnceWith("copy")
    expect(document.querySelector("textarea")).not.toBeInTheDocument()
  })
})
