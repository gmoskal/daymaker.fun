import { describe, expect, it } from "vitest"

import { SEED_MISSION } from "./domain/seed"
import {
  MISSION_PANELS,
  missionPanelForPath,
  presentMission,
  toHumanStopOrder,
} from "./view-model"

describe("mission presenter", () => {
  it("presents Needs first and a Proposed schedule second", () => {
    expect(MISSION_PANELS).toEqual([
      { id: "context", label: "Needs", path: "/needs" },
      { id: "plan", label: "Proposed schedule", path: "/schedule" },
    ])
    expect(missionPanelForPath("/")).toBe("context")

    const screen = presentMission({
      copied: false,
      mission: SEED_MISSION,
      panel: "context",
      selectedStopId: null,
      webMcp: { type: "connected" },
    })
    expect(screen.workspace.type).toBe("context")
    if (screen.workspace.type !== "context")
      throw new Error("Expected Needs screen")
  })

  it("presents one focused plan and the true mission state", () => {
    const screen = presentMission({
      copied: false,
      mission: SEED_MISSION,
      panel: "plan",
      selectedStopId: "biokovo-hike",
      webMcp: { type: "unavailable" },
    })

    expect(screen.missionTitle).toBe("Baška Voda Adventure")
    expect(screen.revision).toBe("REV 06")
    expect(screen.navigation.find((item) => item.active)?.id).toBe("plan")
    expect(screen.workspace.type).toBe("plan")
    if (screen.workspace.type !== "plan") throw new Error("Expected plan screen")

    expect(screen.workspace.stops.map((stop) => stop.statusLabel)).toEqual([
      "Active",
      "Planned",
      "Planned",
      "Planned · Locked",
    ])
    expect(screen.workspace.stops.filter((stop) => stop.selected)).toHaveLength(1)
    expect(
      screen.workspace.stops.find((stop) => stop.id === "dinner"),
    ).toMatchObject({ draggable: false, locked: true, time: "18:30" })
    expect(screen.webMcp).toEqual({
      label: "Manual mode · open in ChatGPT or enable Chrome WebMCP",
      tone: "neutral",
    })
  })

  it("derives Needs from the same mission", () => {
    const mission = {
      ...SEED_MISSION,
      stops: SEED_MISSION.stops.map((stop) =>
        stop.id === "gravel-loop"
          ? { ...stop, status: "completed" as const }
          : stop.id === "biokovo-hike"
            ? { ...stop, status: "skipped" as const }
            : stop,
      ),
    }
    const contextScreen = presentMission({
      copied: true,
      mission,
      panel: "context",
      selectedStopId: null,
      webMcp: { type: "connected" },
    })
    expect(contextScreen.workspace.type).toBe("context")
    if (contextScreen.workspace.type !== "context")
      throw new Error("Expected context screen")
    expect(contextScreen.workspace.copyLabel).toBe("Changes copied for ChatGPT")
    expect(contextScreen.workspace.canCopy).toBe(false)
    expect(contextScreen.workspace.stage).toBe("needs")
    expect(contextScreen.workspace.prompt).toContain(
      '"missionId": "generated-schedule-fixture"',
    )
    expect(contextScreen.workspace.prompt).toContain('"lockedCommitments"')
    expect(contextScreen.workspace.prompt).not.toContain('"events"')
    expect(contextScreen.webMcp).toEqual({
      label: "Site tools connected",
      tone: "positive",
    })

    const planScreen = presentMission({
      copied: false,
      mission,
      panel: "plan",
      selectedStopId: null,
      webMcp: { type: "connected" },
    })
    expect(planScreen.workspace.type).toBe("plan")
    if (planScreen.workspace.type !== "plan")
      throw new Error("Expected plan screen")
    expect(
      planScreen.workspace.stops.find((stop) => stop.id === "gravel-loop")
        ?.mapLinks,
    ).toBeDefined()
  })

  it("unlocks a structured handoff only for human Needs changes", () => {
    const humanEdit = {
      ...SEED_MISSION,
      events: [
        {
          actor: "human" as const,
          at: SEED_MISSION.context.currentTime,
          id: "human-needs-edit",
          summary: "Renamed a need.",
          type: "constraints_updated" as const,
        },
      ],
    }
    const afterHuman = presentMission({
      copied: false,
      mission: humanEdit,
      panel: "context",
      selectedStopId: null,
      webMcp: { type: "connected" },
    })
    if (afterHuman.workspace.type !== "context")
      throw new Error("Expected context screen")
    expect(afterHuman.workspace.canCopy).toBe(true)

    const afterAgent = presentMission({
      copied: false,
      mission: {
        ...humanEdit,
        events: [
          {
            actor: "agent",
            at: SEED_MISSION.context.currentTime,
            id: "agent-needs-update",
            summary: "Updated Needs from chat.",
            type: "context_updated",
          },
          ...humanEdit.events,
        ],
      },
      panel: "context",
      selectedStopId: null,
      webMcp: { type: "connected" },
    })
    if (afterAgent.workspace.type !== "context")
      throw new Error("Expected context screen")
    expect(afterAgent.workspace.canCopy).toBe(false)
  })

  it("maps human drag order into unlocked schedule slots", () => {
    const input = toHumanStopOrder(SEED_MISSION, [
      "gravel-loop",
      "return-shower",
      "biokovo-hike",
    ])

    expect(input?.orderedStops).toEqual([
      { startsAt: "2026-08-30T11:30:00+02:00", stopId: "gravel-loop" },
      { startsAt: "2026-08-30T15:30:00+02:00", stopId: "return-shower" },
      { startsAt: "2026-08-30T17:15:00+02:00", stopId: "biokovo-hike" },
      { startsAt: "2026-08-30T18:30:00+02:00", stopId: "dinner" },
    ])
    expect(toHumanStopOrder(SEED_MISSION, ["dinner"])).toBeNull()
  })
})
