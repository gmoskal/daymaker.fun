import { describe, expect, it } from "vitest"

import { SEED_MISSION } from "./domain/seed"
import {
  MISSION_PANELS,
  missionPanelForPath,
  presentMission,
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
      expandedStopIds: [],
      webMcp: { type: "connected" },
    })
    expect(screen.workspace.type).toBe("context")
    if (screen.workspace.type !== "context")
      throw new Error("Expected Needs screen")
  })

  it("formats the persisted update time in the viewer timezone", () => {
    const mission = {
      ...SEED_MISSION,
      updatedAt: "2026-09-03T13:42:00.000Z",
    }
    const input = {
      copied: false,
      mission,
      panel: "context" as const,
      expandedStopIds: [],
      viewerTimeZone: "Europe/Warsaw",
      webMcp: { type: "connected" as const },
    }

    const screen = presentMission(input)

    expect(screen.updateMarker).toBe(
      "v0.2.4 · updated 3 Sep 2026 · 15:42 CEST",
    )
  })

  it("presents independently expanded plan rows and locations", () => {
    const screen = presentMission({
      copied: false,
      mission: SEED_MISSION,
      panel: "plan",
      expandedStopIds: ["biokovo-hike"],
      webMcp: { type: "unavailable" },
    })

    expect(screen.missionTitle).toBe("Gravel, Grub & a Dip")
    expect(screen.revision).toBe("REV 06")
    expect(screen.navigation.find((item) => item.active)?.id).toBe("plan")
    expect(screen.workspace.type).toBe("plan")
    if (screen.workspace.type !== "plan") throw new Error("Expected plan screen")

    expect(screen.workspace.stops.map((stop) => stop.location)).toEqual([
      "Bike parking, Baška Voda",
      "Biokovo trailhead",
      "Baška Voda apartment",
      "Baška Voda old town",
    ])
    expect(screen.workspace.stops.filter((stop) => stop.expanded)).toHaveLength(1)
    expect(
      screen.workspace.stops.find((stop) => stop.id === "dinner"),
    ).toMatchObject({ expanded: false, time: "18:30" })
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
      expandedStopIds: [],
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
      expandedStopIds: [],
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
      expandedStopIds: [],
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
      expandedStopIds: [],
      webMcp: { type: "connected" },
    })
    if (afterAgent.workspace.type !== "context")
      throw new Error("Expected context screen")
    expect(afterAgent.workspace.canCopy).toBe(false)
  })

})
