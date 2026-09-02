import { describe, expect, it } from "vitest"

import { SEED_MISSION } from "./domain/seed"
import { presentMission } from "./view-model"

describe("mission presenter", () => {
  it("presents the true state and one route order", () => {
    const screen = presentMission({
      copied: false,
      mission: SEED_MISSION,
      selectedStopId: "biokovo-hike",
      webMcp: { type: "unavailable" },
    })

    expect(screen.missionTitle).toBe("Baška Voda Adventure")
    expect(screen.revision).toBe("REV 06")
    expect(screen.commitment).toBe("Dinner 18:30 · 3h 20m left")
    expect(screen.timeline.map((stop) => stop.statusLabel)).toEqual([
      "Active",
      "Planned",
      "Planned",
      "Planned",
    ])
    expect(screen.route.map((stop) => stop.id)).toEqual(
      screen.timeline
        .filter((stop) => stop.routeIndex !== null)
        .map((stop) => stop.id),
    )
    expect(screen.timeline.find((stop) => stop.id === "dinner")).toMatchObject({
      locked: true,
      time: "18:30",
    })
    expect(screen.webMcp).toEqual({
      label: "Manual mode · open in ChatGPT or enable Chrome WebMCP",
      tone: "neutral",
    })
  })

  it("excludes completed and skipped stops from the route", () => {
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
    const screen = presentMission({
      copied: true,
      mission,
      selectedStopId: null,
      webMcp: { type: "connected" },
    })

    expect(screen.route.map((stop) => stop.id)).toEqual([
      "return-shower",
      "dinner",
    ])
    expect(screen.copyLabel).toBe("Prompt copied")
    expect(screen.webMcp).toEqual({
      label: "Site tools connected",
      tone: "positive",
    })
  })
})
