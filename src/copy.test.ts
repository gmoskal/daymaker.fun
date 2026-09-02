import { describe, expect, it } from "vitest"

import { COPY } from "./copy"

describe("English product copy", () => {
  it("keeps the exact demo prompt and mission positioning", () => {
    expect(COPY.tagline).toBe("Your day changed. Your plan should too.")
    expect(COPY.demoPrompt).toContain("Use reliable sources")
    expect(COPY.demoPrompt).toContain("Keep our 18:30 dinner unchanged")
    expect(COPY.demoPrompt).toContain("update the Sidequest board, not just the chat")
  })
})
