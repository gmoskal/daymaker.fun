import { describe, expect, it } from "vitest"

import { COPY } from "./copy"
import type { Mission } from "./domain/mission"
import {
  SEED_MISSION,
  createBlankMission,
  createDemoMission,
} from "./domain/seed"
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
    expect(snapshot).not.toContain('"sampleData"')
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

  it("starts a new plan immediately instead of reconciling an unrelated live board", () => {
    const mission = createBlankMission(
      new Date("2026-09-03T10:15:00Z"),
      "Europe/Warsaw",
    )
    mission.context.brief = "Find a calm swim and excellent coffee."
    const prompt = toMissionPrompt(mission)

    expect(prompt).toContain(
      "https://daymaker.fun/needs?new=1",
    )
    expect(prompt).toContain("continue in Work")
    expect(prompt).toContain("Do not stop")
    expect(prompt).toContain(
      "Treat the copied planning input as a new plan request",
    )
    expect(prompt).toContain(
      "planning URL clears the previous browser-local board",
    )
    expect(prompt).toContain(
      "Do not inspect, compare, preserve, or clear an earlier plan with a tool call",
    )
    expect(prompt).toContain("Immediately call update_day_context")
    expect(prompt).toContain("with replacePlan: true")
    expect(prompt).toContain("before research, clarification, or progress narration")
    expect(prompt).toContain(
      "to initialize this request",
    )
    expect(prompt).not.toContain("If the live board is blank")
    expect(prompt).not.toContain("preserve its current Needs")
    expect(prompt).toContain("sessionUrl")
    expect(prompt).toContain("[Open updated Sidequest plan]")
    expect(prompt).toContain("Do not finish without the clickable link")
  })

  it("marks bundled examples as fictional sample data", () => {
    const prompt = toMissionPrompt(
      createDemoMission("palermo-arrival-demo"),
    )

    expect(prompt).toContain('"sampleData": true')
    expect(prompt).toContain(
      "fictional product demo rather than the person's private travel data",
    )
  })

  it("asks the agent to structure Needs and regenerate every time", () => {
    const prompt = toMissionPrompt(SEED_MISSION)

    expect(prompt).toContain("extract concise Needs from the free-form brief")
    expect(prompt).toContain("replacePlan: true")
    expect(prompt).toContain("only goal")
    expect(prompt).toContain(
      "ask a concise clarifying question only when an essential fact is missing",
    )
    expect(prompt).toContain("set the plan date and starting location")
    expect(prompt).toContain("primary city or area")
    expect(prompt).toContain("most schedule activity happens")
    expect(prompt).toContain("short, specific, playful title")
    expect(prompt).toContain("exact clickable session link")
    expect(prompt).toContain("final successful write")
  })

  it("uses the selected research depth", () => {
    expect(toMissionPrompt(SEED_MISSION, "quick")).toContain(
      "RESEARCH DEPTH: QUICK",
    )
    expect(toMissionPrompt(SEED_MISSION, "normal")).toContain(
      "RESEARCH DEPTH: NORMAL",
    )
    expect(toMissionPrompt(SEED_MISSION, "deep")).toContain(
      "RESEARCH DEPTH: DEEP",
    )
  })

  it("keeps the agent response in the person's request language", () => {
    const mission = createBlankMission(
      new Date("2026-09-03T10:15:00Z"),
      "Europe/Warsaw",
    )
    mission.context.brief = "Find great coffee before my flight."
    const prompt = toMissionPrompt(mission)

    expect(prompt).toMatch(/^LANGUAGE REQUIREMENT:/u)
    expect(prompt).toContain(
      "Use only the primary language of the person's free-form brief or Needs",
    )
    expect(prompt).toContain("Ignore earlier messages")
    expect(prompt).toContain(
      "English planning input requires every message to be in English",
    )
    expect(prompt).toContain(
      "including questions, progress updates, tool-use narration, and the final response",
    )
    expect(prompt).toContain("Do not translate the exact session link")
  })

  it("explains both feedback directions after every generated plan", () => {
    const prompt = toMissionPrompt(SEED_MISSION)

    expect(prompt).toContain("two ways to iterate")
    expect(prompt).toContain("Copy changes to ChatGPT")
    expect(prompt).toContain("paste the copied prompt back into this chat")
    expect(prompt).toContain("feedback directly in this chat")
    expect(prompt).toContain("return another updated session link")
    expect(prompt).toContain("share the link with friends")
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
