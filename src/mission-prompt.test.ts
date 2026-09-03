import { describe, expect, it } from "vitest"

import { COPY, DEMO_INSTRUCTIONS } from "./copy"
import { SEED_MISSION, createBlankMission } from "./domain/seed"
import { toMissionPrompt } from "./mission-prompt"

describe("mission prompt", () => {
  it("copies the complete selected demo context", () => {
    const prompt = toMissionPrompt(SEED_MISSION)
    const snapshot = prompt
      .split(`${COPY.promptSnapshot}\n\n`)
      .at(1)

    expect(prompt).toContain(DEMO_INSTRUCTIONS["baska-voda-demo"])
    expect(snapshot).toBeDefined()
    expect(JSON.parse(snapshot ?? "null")).toEqual(SEED_MISSION)
  })

  it("tells the agent how to replace a blank plan", () => {
    const prompt = toMissionPrompt(
      createBlankMission(new Date("2026-09-03T10:15:00Z"), "UTC"),
    )

    expect(prompt).toContain("replacePlan: true")
    expect(prompt).toContain("get_mission_state")
    expect(prompt).toContain('"id": "personal-plan"')
  })
})
