import { describe, expect, it } from "vitest"

import { COPY } from "./copy"
import type { Mission } from "./domain/mission"
import {
  SEED_MISSION,
  createBlankMission,
  createDemoMission,
} from "./domain/seed"
import {
  toMissionHandoffPrompt,
  toMissionPrompt,
  type MissionPromptTarget,
} from "./mission-prompt"

const updateTarget: MissionPromptTarget = {
  type: "update",
  url: "https://daymaker.fun/schedule#session=portable-state",
}

describe("mission prompt", () => {
  it("copies needs without proposed stops", () => {
    const mission = structuredClone(SEED_MISSION) as Mission & {
      context: Mission["context"] & { brief: string }
    }
    mission.context.brief =
      "Replace the steep hike with a calm swim and keep dinner fixed."
    const prompt = toMissionPrompt(mission, undefined, updateTarget)
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
      handoffMode: "update",
      needs: expect.arrayContaining([
        { fixed: true, label: "keep dinner at 18:30" },
      ]),
      revision: 6,
    })
    expect(snapshot).not.toContain('"stops"')
    expect(snapshot).not.toContain('"events"')
    expect(snapshot).not.toContain('"mustHaves"')
    expect(snapshot).not.toContain('"sampleData"')
    expect(prompt).toContain("UPDATE THIS SESSION")
    expect(prompt).toContain("Do not clear the board")
  })

  it("tells the agent how to replace a blank plan", () => {
    const prompt = toMissionPrompt(
      createBlankMission(new Date("2026-09-03T10:15:00Z"), "UTC"),
    )

    expect(prompt).toContain("Generate the complete Proposed schedule")
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
      "HANDOFF MODE: NEW SESSION",
    )
    expect(prompt).toContain(
      "one-shot URL clears any previous browser-local board",
    )
    expect(prompt).toContain(
      "Do not inspect, reconcile, or preserve any unrelated board",
    )
    expect(prompt).toContain("call update_day_context")
    expect(prompt).toContain("and replacePlan: true")
    expect(prompt).not.toContain("If the live board is blank")
    expect(prompt).not.toContain("preserve its current Needs")
    expect(prompt).toContain("sessionUrl")
    expect(prompt).toContain("[Open updated Daymaker plan]")
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

  it("asks the agent to structure Needs for a new session", () => {
    const prompt = toMissionPrompt(SEED_MISSION)

    expect(prompt).toContain("extract concise Needs from the free-form brief")
    expect(prompt).toContain("replacePlan: true")
    expect(prompt).toContain("only goal")
    expect(prompt).toContain(
      "Ask one concise clarifying question only when an essential fact is missing",
    )
    expect(prompt).toContain("set the plan date and practical starting location")
    expect(prompt).toContain("primary city or area")
    expect(prompt).toContain("most schedule activity happens")
    expect(prompt).toContain("short, specific, playful title")
    expect(prompt).toContain("exact clickable session link")
    expect(prompt).toContain("final successful write")
  })

  it("updates a matching session from the human Needs delta without clearing", () => {
    const mission: Mission = {
      ...structuredClone(SEED_MISSION),
      events: [
        {
          actor: "human",
          at: SEED_MISSION.context.currentTime,
          id: "edit-2",
          summary: "Removed need — dog with us",
          type: "constraints_updated",
        },
        {
          actor: "human",
          at: SEED_MISSION.context.currentTime,
          id: "edit-1",
          summary: "Added requirement — shaded swim",
          type: "constraints_updated",
        },
        {
          actor: "agent",
          at: SEED_MISSION.context.currentTime,
          id: "plan-write",
          summary: "Added Punta Rata",
          type: "stop_added",
        },
      ],
      id: "personal-plan-session-a",
    }

    const prompt = toMissionPrompt(mission, "normal", updateTarget)
    const snapshot = JSON.parse(
      prompt.split(`${COPY.promptSnapshot}\n\n`).at(1) ?? "null",
    )

    expect(prompt).toContain(updateTarget.url)
    expect(prompt).toContain("compare its mission.id with missionId")
    expect(prompt).toContain("replacePlan: false")
    expect(prompt).toContain("update only affected schedule stops")
    expect(prompt).toContain("Preserve every unaffected stop")
    expect(snapshot).toMatchObject({
      handoffMode: "update",
      missionId: "personal-plan-session-a",
      needsDelta: [
        "Added requirement — shaded swim",
        "Removed need — dog with us",
      ],
    })
  })

  it("embeds the complete current session in an iterative handoff URL", async () => {
    const mission: Mission = {
      ...structuredClone(SEED_MISSION),
      id: "personal-plan-session-link",
    }

    const prompt = await toMissionHandoffPrompt(mission)
    const openLine = prompt.split("\n").find((line) => line.startsWith("Open "))
    const url = openLine?.slice(5).split(", continue").at(0)

    expect(url).toContain("https://daymaker.fun/schedule#session=")
    expect(prompt).toContain('"handoffMode": "update"')
    expect(prompt).toContain('"missionId": "personal-plan-session-link"')
    expect(prompt).not.toContain("Open https://daymaker.fun/needs?new=1")
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
