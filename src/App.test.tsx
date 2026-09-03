import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { App } from "./App"
import { SEED_MISSION } from "./domain/seed"
import { createMissionStore, type StoragePort } from "./store"
import type { WebMcpRegistration } from "./webmcp"

vi.mock("./MissionMap", () => ({
  MissionMap: ({ route }: { route: Array<{ id: string }> }) => (
    <div data-testid="mission-map">{route.map((stop) => stop.id).join(",")}</div>
  ),
}))

const storage: StoragePort = {
  getItem: () => null,
  removeItem: () => undefined,
  setItem: () => undefined,
}
const store = () =>
  createMissionStore({
    id: () => "ui-id",
    mission: SEED_MISSION,
    storage,
  })
const registration = (supported: boolean): Promise<WebMcpRegistration> =>
  Promise.resolve({ dispose: () => undefined, supported })

afterEach(() => vi.restoreAllMocks())

describe("Sidequest app", () => {
  it("keeps one focused workspace with explicit controls", () => {
    const missionStore = store()
    render(<App registration={registration(false)} store={missionStore} />)

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }))
    expect(screen.getByRole("tab", { name: "Plan" })).toHaveAttribute(
      "aria-selected",
      "true",
    )
    expect(screen.queryByTestId("mission-map")).not.toBeInTheDocument()

    const activeStop = within(screen.getByTestId("stop-gravel-loop"))
    const plannedStop = within(screen.getByTestId("stop-biokovo-hike"))
    expect(
      activeStop.getByRole("button", { name: "Mark Forest gravel loop done" }),
    ).toHaveTextContent("Mark done")
    expect(
      activeStop.getByRole("button", {
        name: "Show Forest gravel loop on map",
      }),
    ).toHaveTextContent("View on map")
    expect(
      plannedStop.queryByRole("button", {
        name: "Mark Biokovo sunset hike done",
      }),
    ).not.toBeInTheDocument()

    fireEvent.click(
      plannedStop.getByRole("button", { name: "View Biokovo sunset hike" }),
    )

    expect(
      within(screen.getByTestId("stop-biokovo-hike")).getByRole("button", {
        name: "Mark Biokovo sunset hike done",
      }),
    ).toBeInTheDocument()
    expect(
      within(screen.getByTestId("stop-gravel-loop")).queryByRole("button", {
        name: "Mark Forest gravel loop done",
      }),
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("tab", { name: "Route" }))

    expect(screen.getByTestId("mission-map")).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Schedule" })).not.toBeInTheDocument()
  })

  it("exposes draggable operational lists", () => {
    const missionStore = store()
    render(<App registration={registration(false)} store={missionStore} />)

    expect(screen.getByTestId("stop-biokovo-hike")).toHaveAttribute(
      "data-draggable",
      "true",
    )
    expect(screen.getByTestId("stop-dinner")).toHaveAttribute(
      "data-draggable",
      "false",
    )

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }))
    fireEvent.click(screen.getByRole("tab", { name: "Context" }))

    expect(
      screen.getByRole("textbox", { name: "Edit requirement: dog with us" }).closest("li"),
    ).toHaveAttribute("data-draggable", "true")
  })

  it("exposes stop locks as explicit controls", () => {
    const missionStore = store()
    render(<App registration={registration(false)} store={missionStore} />)

    expect(
      screen.getByRole("button", { name: "Unlock Dinner reservation" }),
    ).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole("button", { name: "Lock Biokovo sunset hike" }),
    )

    expect(
      missionStore.getSnapshot().stops.find((stop) => stop.id === "biokovo-hike"),
    ).toMatchObject({ locked: true })
    expect(screen.getByTestId("stop-biokovo-hike")).toHaveAttribute(
      "data-draggable",
      "false",
    )

    fireEvent.click(
      screen.getByRole("button", { name: "Unlock Biokovo sunset hike" }),
    )

    expect(screen.getByTestId("stop-biokovo-hike")).toHaveAttribute(
      "data-draggable",
      "true",
    )
  })

  it("edits requirements through the shared store", () => {
    const missionStore = store()
    render(<App registration={registration(false)} store={missionStore} />)

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }))
    fireEvent.click(screen.getByRole("tab", { name: "Context" }))
    fireEvent.change(screen.getByRole("textbox", { name: "New requirement" }), {
      target: { value: "avoid steep climbs" },
    })
    fireEvent.keyDown(screen.getByRole("textbox", { name: "New requirement" }), {
      key: "Enter",
    })

    expect(screen.getByDisplayValue("avoid steep climbs")).toBeInTheDocument()
    expect(missionStore.getSnapshot().context.constraints).toContainEqual(
      expect.objectContaining({ label: "avoid steep climbs", status: "active" }),
    )

    fireEvent.click(screen.getByRole("button", { name: "Cross out dog with us" }))

    expect(
      screen.getByRole("textbox", { name: "Edit requirement: dog with us" }).closest("li"),
    ).toHaveAttribute("data-status", "crossed")
  })

  it("adds and renames plan items inline", () => {
    const missionStore = store()
    render(<App registration={registration(false)} store={missionStore} />)

    const title = screen.getByRole("textbox", {
      name: "Edit item title: Forest gravel loop",
    })
    fireEvent.change(title, { target: { value: "Coastal gravel loop" } })
    fireEvent.blur(title)

    expect(missionStore.getSnapshot().stops[0]?.title).toBe(
      "Coastal gravel loop",
    )

    const addItem = screen.getByRole("textbox", { name: "Add item" })
    fireEvent.change(addItem, { target: { value: "Call the hotel" } })
    fireEvent.keyDown(addItem, { key: "Enter" })

    expect(missionStore.getSnapshot().stops).toContainEqual(
      expect.objectContaining({ title: "Call the hotel" }),
    )
  })

  it("uses the shared store for a human Done action", async () => {
    const missionStore = store()
    render(<App registration={registration(false)} store={missionStore} />)

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }))
    await waitFor(() =>
      expect(
        screen.getByText("Manual mode · open in ChatGPT or enable Chrome WebMCP"),
      ).toBeInTheDocument(),
    )
    fireEvent.click(screen.getByRole("button", { name: "Close menu" }))
    fireEvent.click(
      screen.getByRole("button", { name: "Mark Forest gravel loop done" }),
    )

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }))
    expect(screen.getByText("REV 07")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Close menu" }))
    expect(screen.getByTestId("stop-gravel-loop")).toHaveTextContent("Completed")
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }))
    fireEvent.click(screen.getByRole("tab", { name: "History" }))
    expect(screen.getByLabelText("Activity log")).toHaveTextContent("Human")
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }))
    fireEvent.click(screen.getByRole("tab", { name: "Route" }))
    expect(screen.getByTestId("mission-map")).not.toHaveTextContent("gravel-loop")
  })

  it("renders source-backed additions as secure links", () => {
    const missionStore = store()
    missionStore.dispatch({
      type: "AddStop",
      value: {
        actor: "agent",
        input: {
          durationMinutes: 70,
          expectedRevision: 6,
          kind: "activity",
          location: { label: "Punta Rata", lat: 43.37, lng: 16.92 },
          rationale: "Low-effort water time.",
          source: {
            checkedAt: "2026-08-30T15:11:00+02:00",
            title: "Punta Rata — TZ Brela",
            url: "https://brela.hr/en/beaches/the-punta-rata-beach",
          },
          startsAt: "2026-08-30T15:30:00+02:00",
          title: "Punta Rata swim & snorkel",
          travelMinutesFromPrevious: 12,
        },
      },
    })

    render(<App registration={registration(true)} store={missionStore} />)
    fireEvent.click(
      screen.getByRole("button", { name: "View Punta Rata swim & snorkel" }),
    )
    const source = screen.getByRole("link", { name: /Punta Rata — TZ Brela/ })

    expect(source).toHaveAttribute(
      "href",
      "https://brela.hr/en/beaches/the-punta-rata-beach",
    )
    expect(source).toHaveAttribute("target", "_blank")
    expect(source).toHaveAttribute("rel", "noopener noreferrer")
  })

  it("resets a changed mission after confirmation", () => {
    const missionStore = store()
    missionStore.dispatch({
      type: "UpdateStop",
      value: {
        actor: "human",
        input: {
          expectedRevision: 6,
          reason: "The ride is complete.",
          status: "completed",
          stopId: "gravel-loop",
        },
      },
    })
    vi.spyOn(window, "confirm").mockReturnValue(true)
    render(<App registration={registration(false)} store={missionStore} />)

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }))
    fireEvent.click(screen.getByRole("button", { name: "Reset demo" }))

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }))
    expect(screen.getByText("REV 06")).toBeInTheDocument()
    expect(screen.getByTestId("stop-gravel-loop")).toHaveTextContent("Active")
    expect(window.confirm).toHaveBeenCalledOnce()
  })
})
