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
    expect(COPY.promptOpen).toContain("continue in Work")
    expect(COPY.promptProtocol).toContain("If the live board is blank")
    expect(COPY.planningInstruction).toContain("generate a Proposed schedule")
    expect(COPY.planningInstruction).toContain("primary city or area")
    expect(COPY.planningInstruction).toContain("short, specific, playful title")
    expect(COPY.copyPrompt).toBe("Copy to ChatGPT")
    expect(COPY.copyChanges).toBe("Copy changes to ChatGPT")
    expect(COPY.agentHint).toContain("mobile or desktop")
    expect(COPY.agentHint).toContain("open Sidequest in Work")
    expect(COPY.planningBriefPlaceholder).toContain("Example:")
    expect(Object.values(COPY)).toContain("Must keep")
    expect(Object.values(COPY)).toContain("Can adapt")
    expect(Object.values(COPY)).toContain("Allow {need} to adapt")
    expect(Object.values(COPY)).toContain("Make {need} non-negotiable")
    expect(Object.values(COPY)).not.toContain("Fixed")
    expect(Object.values(COPY)).not.toContain("Flexible")
    expect(SIDEQUEST_URL).toBe("https://sidequest-webmcp-eta.vercel.app")
    expect(COPY.emptyPlanHint).toContain("open items for details and maps")
    expect(COPY.emptyPlanHint).toContain(
      "Open the complete proposal in Google Maps",
    )
  })
})
