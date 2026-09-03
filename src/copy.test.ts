import { describe, expect, it } from "vitest"

import { COPY, DEMO_INSTRUCTIONS, SIDEQUEST_URL } from "./copy"

describe("English product copy", () => {
  it("keeps the agent handoff and mission positioning explicit", () => {
    expect(COPY.tagline).toBe("Your day changed. Your plan should too.")
    expect(DEMO_INSTRUCTIONS["baska-voda-demo"]).toContain("reliable sources")
    expect(DEMO_INSTRUCTIONS["baska-voda-demo"]).toContain(
      "Keep the 18:30 dinner unchanged",
    )
    expect(COPY.promptOpen).toContain("not only in chat")
    expect(COPY.freshInstruction).toContain("replacePlan: true")
    expect(COPY.copyPrompt).toBe("Copy full context for ChatGPT")
    expect(SIDEQUEST_URL).toBe("https://sidequest-webmcp-eta.vercel.app")
    expect(COPY.done).toBe("Mark done")
    expect(COPY.skip).toBe("Skip")
    expect(COPY.undo).toBe("Restore")
    expect(COPY.emptyPlanHint).toContain("Drag any unlocked item to reorder it")
    expect(COPY.emptyPlanHint).toContain(
      "Route opens the whole plan in Google Maps",
    )
  })
})
