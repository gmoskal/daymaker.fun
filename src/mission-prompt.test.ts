import { describe, expect, it } from "vitest"

import { COPY } from "./copy"
import type { Mission } from "./domain/mission"
import { SEED_MISSION, createBlankMission } from "./domain/seed"
import { toMissionPrompt } from "./mission-prompt"

describe("mission prompt", () => {
  it("copies needs without proposed stops", () => {
    const mission = structuredClone(SEED_MISSION) as Mission & {
      context: Mission["context"] & { brief: string }
    }
    mission.context.brief =
      "Replace the steep hike with a calm swim and keep dinner fixed."
    const prompt = toMissionPrompt(mission)
    const snapshot = prompt
      .split(`${COPY.promptSnapshot}\n\n`)
      .at(1)

    expect(snapshot).toBeDefined()
    expect(JSON.parse(snapshot ?? "null")).toMatchObject({
      brief: "Replace the steep hike with a calm swim and keep dinner fixed.",
      lockedCommitments: [
        expect.objectContaining({ locked: true, title: "Dinner reservation" }),
      ],
      missionId: "generated-schedule-fixture",
      needs: expect.arrayContaining([
        { fixed: true, label: "keep dinner at 18:30" },
      ]),
      revision: 6,
    })
    expect(snapshot).not.toContain('"stops"')
    expect(snapshot).not.toContain('"events"')
    expect(snapshot).not.toContain('"mustHaves"')
    expect(prompt).toContain("generate a Proposed schedule")
  })

  it("tells the agent how to replace a blank plan", () => {
    const prompt = toMissionPrompt(
      createBlankMission(new Date("2026-09-03T10:15:00Z"), "UTC"),
    )

    expect(prompt).toContain("generate a Proposed schedule")
    expect(prompt).toContain("get_mission_state")
    expect(prompt).toContain('"missionId": "personal-plan"')
    expect(prompt).not.toContain("Untitled plan")
  })

  it("asks the agent to structure Needs and regenerate every time", () => {
    const prompt = toMissionPrompt(SEED_MISSION)

    expect(prompt).toContain("extract concise Needs from the free-form brief")
    expect(prompt).toContain("replacePlan: true")
    expect(prompt).toContain("only goal")
    expect(prompt).toContain("ask concise clarifying questions")
    expect(prompt).toContain("set the plan date and starting location")
    expect(prompt).toContain("open Proposed schedule")
  })

  it("copies planning input according to its stage", () => {
    const blank = createBlankMission(new Date("2026-09-03T10:15:00Z"), "UTC")
    blank.context.brief = "Find a quiet swim."
    expect(toMissionPrompt(blank)).not.toContain('"needs"')

    const structured = structuredClone(blank)
    structured.context.stage = "needs"
    expect(toMissionPrompt(structured)).toContain('"needs": []')
  })
})
