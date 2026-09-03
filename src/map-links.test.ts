import { describe, expect, it } from "vitest"

import { appleMapsUrl, googleMapsUrl, googleScheduleUrl } from "./map-links"

const origin = { coordinates: [37.7929, -122.3971] as [number, number], title: "Embarcadero" }
const market = { coordinates: [37.7955, -122.3937] as [number, number], title: "Ferry Plaza" }
const library = { coordinates: [37.7789, -122.4158] as [number, number], title: "Main Library" }

describe("map links", () => {
  it("creates provider links for one place", () => {
    expect(googleMapsUrl(market)).toContain("google.com/maps/search")
    expect(googleMapsUrl(market)).toContain("37.7955%2C-122.3937")
    expect(appleMapsUrl(market)).toContain("maps.apple.com")
    expect(appleMapsUrl(market)).toContain("q=Ferry+Plaza")
  })

  it("creates one ordered Google Maps schedule", () => {
    const url = googleScheduleUrl(origin, [market, library])

    expect(url).toContain("google.com/maps/dir")
    expect(url).toContain("origin=37.7929%2C-122.3971")
    expect(url).toContain("destination=37.7789%2C-122.4158")
    expect(url).toContain("waypoints=37.7955%2C-122.3937")
    expect(googleScheduleUrl(origin, [])).toBeNull()
  })
})
