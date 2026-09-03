import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { MissionMap } from "./MissionMap"
import type { RouteStopScreen } from "./view-model"

const route: RouteStopScreen[] = [
  {
    coordinates: [43.3569, 16.9502],
    id: "gravel-loop",
    index: 1,
    location: "Bike parking, Baška Voda",
    selected: true,
    title: "Forest gravel loop",
  },
  {
    coordinates: [43.341, 17.055],
    id: "biokovo-hike",
    index: 2,
    location: "Biokovo trailhead",
    selected: false,
    title: "Biokovo sunset hike",
  },
]

describe("MissionMap", () => {
  it("previews Google Maps and offers both map providers", () => {
    const onSelect = vi.fn()
    render(<MissionMap onSelect={onSelect} route={route} />)

    const preview = screen.getByTitle("Google Maps preview: Forest gravel loop")
    expect(preview).toHaveAttribute(
      "src",
      expect.stringContaining("https://maps.google.com/maps?"),
    )
    expect(preview).toHaveAttribute("src", expect.stringContaining("output=embed"))

    const google = screen.getAllByRole("link", { name: /Open in Google Maps/ })
    expect(google[0]).toHaveAttribute(
      "href",
      "https://www.google.com/maps/search/?api=1&query=43.3569%2C16.9502",
    )
    expect(google[0]).toHaveAttribute("rel", "noopener noreferrer")
    expect(screen.getByRole("link", { name: "Open in Apple Maps" })).toHaveAttribute(
      "href",
      "https://maps.apple.com/?ll=43.3569%2C16.9502&q=Forest+gravel+loop",
    )

    fireEvent.click(screen.getByRole("button", { name: "2 Biokovo sunset hike" }))
    expect(onSelect).toHaveBeenCalledWith("biokovo-hike")
  })
})
