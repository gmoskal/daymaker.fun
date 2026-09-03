import { describe, expect, it } from "vitest"

import { SEED_MISSION } from "./domain/seed"
import { presentMission, toHumanStopOrder } from "./view-model"

describe("mission presenter", () => {
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

  it("derives route and context workspaces from the same mission", () => {
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
    const routeScreen = presentMission({
      copied: true,
      mission,
      panel: "route",
      selectedStopId: null,
      webMcp: { type: "connected" },
    })
    expect(routeScreen.workspace.type).toBe("route")
    if (routeScreen.workspace.type !== "route")
      throw new Error("Expected route screen")
    expect(routeScreen.workspace.route.map((stop) => stop.id)).toEqual([
      "return-shower",
      "dinner",
    ])

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
    expect(contextScreen.workspace.copyLabel).toBe("Prompt copied")
    expect(contextScreen.webMcp).toEqual({
      label: "Site tools connected",
      tone: "positive",
    })
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
