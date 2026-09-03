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

  it("bootstraps a fresh mobile Work board instead of stopping at the mode handoff", () => {
    const mission = createBlankMission(
      new Date("2026-09-03T10:15:00Z"),
      "Europe/Warsaw",
    )
    mission.context.brief = "Find a calm swim and excellent coffee."
    const prompt = toMissionPrompt(mission)

    expect(prompt).toContain(
      "https://sidequest-webmcp-eta.vercel.app/needs",
    )
    expect(prompt).toContain("continue in Work")
    expect(prompt).toContain("Do not stop")
    expect(prompt).toContain("If the live board is blank")
    expect(prompt).toContain("bootstrap it from the copied planning input")
    expect(prompt).toContain("Do not discard the copied brief")
    expect(prompt).toContain("using the live revision")
    expect(prompt).toContain("sessionUrl")
    expect(prompt).toContain("[Open updated Sidequest plan]")
    expect(prompt).toContain("Do not finish without the clickable link")
  })

  it("asks the agent to structure Needs and regenerate every time", () => {
    const prompt = toMissionPrompt(SEED_MISSION)

    expect(prompt).toContain("extract concise Needs from the free-form brief")
    expect(prompt).toContain("replacePlan: true")
    expect(prompt).toContain("only goal")
    expect(prompt).toContain("ask concise clarifying questions")
    expect(prompt).toContain("set the plan date and starting location")
    expect(prompt).toContain("primary city or area")
    expect(prompt).toContain("most schedule activity happens")
    expect(prompt).toContain("short, specific, playful title")
    expect(prompt).toContain("exact clickable session link")
    expect(prompt).toContain("final successful write")
  })

  it("keeps the agent response in the person's request language", () => {
    const mission = createBlankMission(
      new Date("2026-09-03T10:15:00Z"),
      "Europe/Warsaw",
    )
    mission.context.brief = "Find great coffee before my flight."
    const prompt = toMissionPrompt(mission)

    expect(prompt).toContain(
      "all user-facing questions, progress summaries, and the final response",
    )
    expect(prompt).toContain(
      "use the language of the person's latest message",
    )
    expect(prompt).toContain("Do not translate the exact session link")
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
