import { describe, expect, it } from "vitest"

import { COPY } from "./copy"

describe("English product copy", () => {
  it("keeps the exact demo prompt and mission positioning", () => {
    expect(COPY.tagline).toBe("Your day changed. Your plan should too.")
    expect(COPY.demoPrompt).toContain("Use reliable sources")
    expect(COPY.demoPrompt).toContain("Keep our 18:30 dinner unchanged")
    expect(COPY.demoPrompt).toContain("https://sidequest-webmcp-eta.vercel.app")
    expect(COPY.demoPrompt).toContain("not just in the chat")
    expect(COPY.freshPrompt).toContain("This is a new plan")
    expect(COPY.copyPrompt).toBe("Copy prompt for ChatGPT")
    expect(COPY.done).toBe("Mark done")
    expect(COPY.skip).toBe("Skip")
    expect(COPY.undo).toBe("Restore")
    expect(COPY.emptyPlanHint).toContain("Drag any unlocked item to reorder it")
    expect(COPY.emptyPlanHint).toContain(
      "Route opens the whole plan in Google Maps",
    )
  })
})
