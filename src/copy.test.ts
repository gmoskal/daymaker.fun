import { describe, expect, it } from "vitest"

import { COPY, SIDEQUEST_URL } from "./copy"

describe("English product copy", () => {
  it("keeps the agent handoff and mission positioning explicit", () => {
    const allCopy = Object.values(COPY).join(" ")

    expect(COPY.tagline).toBe("Your day changed. Your plan should too.")
    expect(COPY.contextTitle).toBe("Needs")
    expect(COPY.planTitle).toBe("Proposed schedule")
    expect(COPY.planningBrief).toBe("1 · Describe your needs")
    expect(COPY.handoffTitle).toBe("2 · Copy to ChatGPT")
    expect(COPY.constraintsTitle).toBe("3 · Review and edit needs")
    expect(allCopy).not.toContain("Must-haves")
    expect(COPY.promptOpen).toContain("not only in chat")
    expect(COPY.promptOpen).toContain("continue in Work")
    expect(COPY.promptProtocol).toContain(
      "Use the live board only to obtain the current revision",
    )
    expect(COPY.promptProtocol).toContain("replace it even when that board is populated")
    expect(COPY.promptProtocol).toContain("sessionUrl")
    expect(COPY.promptProtocol).toContain("[Open updated Sidequest plan]")
    expect(allCopy).toContain("LANGUAGE REQUIREMENT")
    expect(allCopy).toContain(
      "Do not follow the language of the surrounding conversation",
    )
    expect(allCopy).toContain(
      "English planning input requires every message to be in English",
    )
    expect(allCopy).toContain(
      "Polish planning input requires every message to be in Polish",
    )
    expect(allCopy).toContain(
      "Do not narrate in one language while writing the plan in another",
    )
    expect(allCopy).toContain(
      "proper names, source titles, and exact tool-returned values unchanged",
    )
    expect(COPY.planningInstruction).toContain("generate a Proposed schedule")
    expect(COPY.planningInstruction).toContain("primary city or area")
    expect(COPY.planningInstruction).toContain("short, specific, playful title")
    expect(COPY.planningInstruction).toContain("two ways to iterate")
    expect(COPY.planningInstruction).toContain("Copy changes to ChatGPT")
    expect(COPY.planningInstruction).toContain("feedback directly in this chat")
    expect(COPY.planningInstruction).toContain("share the link with friends")
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
    expect(SIDEQUEST_URL).toBe("https://daymaker.fun")
    expect(COPY.emptyPlanHint).toContain("open items for details and maps")
    expect(COPY.emptyPlanHint).toContain(
      "Open the complete proposal in Google Maps",
    )
    expect(COPY.planIteration).toBe("Iteration {number}")
    expect(COPY.copyPlanLink).toBe("Copy link")
  })
})
