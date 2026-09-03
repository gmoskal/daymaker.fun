import { describe, expect, it } from "vitest"

import { COPY, SIDEQUEST_URL } from "./copy"

describe("English product copy", () => {
  it("keeps the agent handoff and mission positioning explicit", () => {
    expect(COPY.tagline).toBe("Your day changed. Your plan should too.")
    expect(COPY.contextTitle).toBe("Needs")
    expect(COPY.planTitle).toBe("Proposed schedule")
    expect(COPY.planningBrief).toBe("1 · Describe your needs")
    expect(COPY.handoffTitle).toBe("2 · Copy to ChatGPT")
    expect(COPY.constraintsTitle).toBe("3 · Review and edit needs")
    expect(Object.values(COPY).join(" ")).not.toContain("Must-haves")
    expect(COPY.promptOpen).toContain("not only in chat")
    expect(COPY.planningInstruction).toContain("generate a Proposed schedule")
    expect(COPY.copyPrompt).toBe("Copy to ChatGPT")
    expect(COPY.copyChanges).toBe("Copy changes to ChatGPT")
    expect(COPY.planningBriefPlaceholder).toContain("Example:")
    expect(COPY.fixed).toBe("Fixed")
    expect(SIDEQUEST_URL).toBe("https://sidequest-webmcp-eta.vercel.app")
    expect(COPY.done).toBe("Mark done")
    expect(COPY.skip).toBe("Skip")
    expect(COPY.undo).toBe("Restore")
    expect(COPY.emptyPlanHint).toContain("Drag any unlocked item to reorder it")
    expect(COPY.emptyPlanHint).toContain(
      "Open the complete proposal in Google Maps",
    )
  })
})
