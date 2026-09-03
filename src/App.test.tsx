import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { App } from "./App"
import {
  PALERMO_ARRIVAL_MISSION,
  SEED_MISSION,
  createBlankMission,
} from "./domain/seed"
import { createMissionStore, type StoragePort } from "./store"
import type { WebMcpRegistration } from "./webmcp"

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
const blankStore = () =>
  createMissionStore({
    id: () => "ui-id",
    mission: createBlankMission(new Date("2026-09-03T10:15:00Z"), "UTC"),
    storage,
  })
const registration = (supported: boolean): Promise<WebMcpRegistration> =>
  Promise.resolve({ dispose: () => undefined, supported })
const originalClipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard")

beforeEach(() => window.history.replaceState(null, "", "/schedule"))

afterEach(() => {
  vi.restoreAllMocks()
  window.history.replaceState(null, "", "/")
  if (originalClipboard === undefined) {
    Reflect.deleteProperty(navigator, "clipboard")
  } else {
    Object.defineProperty(navigator, "clipboard", originalClipboard)
  }
})

describe("Sidequest app", () => {
  it("starts in Needs with two tabs", () => {
    window.history.replaceState(null, "", "/")
    render(<App registration={registration(false)} store={blankStore()} />)

    const tabs = screen.getAllByRole("tab")
    expect(tabs).toHaveLength(2)
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      "Needs",
      "Proposed schedule",
    ])
    expect(screen.getByRole("tab", { name: "Needs" })).toHaveAttribute(
      "aria-selected",
      "true",
    )
    expect(window.location.pathname).toBe("/needs")
    expect(screen.queryByRole("tab", { name: "Route" })).not.toBeInTheDocument()
    expect(screen.getByText("Preferred pace")).toBeVisible()
    expect(screen.getByText("Balanced")).toBeVisible()
  })

  it("copies editable Needs for the agent", async () => {
    window.history.replaceState(null, "", "/needs")
    const missionStore = store()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    })
    render(<App registration={registration(true)} store={missionStore} />)

    const brief = screen.getByRole("textbox", { name: "What you need" })
    fireEvent.change(brief, {
      target: { value: "Find a calm swim and keep dinner fixed." },
    })
    fireEvent.blur(brief)
    fireEvent.click(screen.getByRole("button", { name: "Copy needs for ChatGPT" }))

    await waitFor(() => expect(writeText).toHaveBeenCalledOnce())
    const prompt = writeText.mock.calls[0]?.[0]
    expect(prompt).toContain("Find a calm swim and keep dinner fixed.")
    expect(prompt).toContain('"lockedCommitments"')
    expect(prompt).not.toContain('"stops"')
  })

  it("edits all forms of Needs", () => {
    window.history.replaceState(null, "", "/needs")
    const missionStore = store()
    render(<App registration={registration(false)} store={missionStore} />)

    expect(screen.getByRole("textbox", { name: "What you need" }))
      .toHaveAttribute("placeholder", expect.stringContaining("Example:"))
    fireEvent.click(
      screen.getByRole("button", { name: "Mark dog with us as fixed" }),
    )
    expect(
      missionStore.getSnapshot().context.constraints.find(
        (need) => need.id === "constraint-dog",
      ),
    ).toMatchObject({ fixed: true })

    fireEvent.click(screen.getByRole("button", { name: "Remove dog with us" }))
    expect(
      missionStore.getSnapshot().context.constraints.some(
        (need) => need.id === "constraint-dog",
      ),
    ).toBe(false)
  })

  it("offers only the two free-form Needs examples", () => {
    window.history.replaceState(null, "", "/needs")
    render(<App registration={registration(false)} store={blankStore()} />)

    fireEvent.click(screen.getByRole("button", { name: "Load demo" }))
    const examples = screen.getAllByRole("menuitem")
    expect(examples).toHaveLength(2)
    expect(examples.map((item) => item.textContent)).toEqual([
      expect.stringContaining("Palermo arrival"),
      expect.stringContaining("South Croatia gravel day"),
    ])
  })

  it("exposes maps from every located schedule item", () => {
    window.history.replaceState(null, "", "/schedule")
    render(<App registration={registration(false)} store={store()} />)

    fireEvent.click(screen.getByRole("button", { name: "Forest gravel loop" }))

    expect(
      screen.getByRole("link", {
        name: "Open in Google Maps: Forest gravel loop",
      }),
    ).toBeVisible()
    expect(
      screen.getByRole("link", {
        name: "Open in Apple Maps: Forest gravel loop",
      }),
    ).toBeVisible()
    expect(
      screen.getByRole("link", { name: "Open proposed schedule in Google Maps" }),
    ).toBeVisible()
  })

  it("shows the latest release at the page bottom", () => {
    render(<App registration={registration(false)} store={blankStore()} />)

    expect(screen.getByText("v0.2.0 · updated 3 Sep 2026")).toBeVisible()
  })

  it("starts as a blank plan and keeps the demo optional", () => {
    const missionStore = blankStore()
    vi.spyOn(window, "confirm").mockReturnValue(true)
    render(<App registration={registration(false)} store={missionStore} />)

    expect(screen.getByText(/Drag any unlocked item to reorder it/)).toBeVisible()
    expect(screen.getByRole("button", { name: "Copy needs for ChatGPT" }))
      .toBeVisible()

    fireEvent.click(screen.getByRole("button", { name: "Load demo" }))
    fireEvent.click(screen.getByRole("menuitem", { name: /Palermo arrival/ }))
    expect(screen.getByRole("textbox", { name: "What you need" }))
      .toHaveValue(PALERMO_ARRIVAL_MISSION.context.brief)
    expect(
      screen.getByRole("textbox", {
        name: "Edit need: Hotel Trinacria check-in at 16:00",
      }),
    ).toBeVisible()

    fireEvent.click(screen.getByRole("button", { name: "New plan" }))
    expect(missionStore.getSnapshot().stops).toEqual([])
    expect(screen.getByRole("textbox", { name: "What you need" })).toHaveValue("")
  })

  it("loads a selected sample from the demo menu", () => {
    const missionStore = blankStore()
    render(<App registration={registration(false)} store={missionStore} />)

    fireEvent.click(screen.getByRole("button", { name: "Load demo" }))
    expect(screen.getByRole("menu", { name: "Sample plans" })).toBeVisible()
    expect(screen.getAllByRole("menuitem")).toHaveLength(2)
    fireEvent.click(screen.getByRole("menuitem", { name: /Palermo arrival/ }))

    expect(missionStore.getSnapshot().title).toBe("Palermo arrival")
    expect(screen.getByRole("textbox", { name: "What you need" }))
      .toHaveValue(PALERMO_ARRIVAL_MISSION.context.brief)
    expect(screen.queryByRole("menu", { name: "Sample plans" }))
      .not.toBeInTheDocument()
  })

  it("exposes persistent side tabs without technical state", async () => {
    render(<App registration={registration(false)} store={store()} />)

    expect(screen.getByRole("tablist", { name: "Mission views" }))
      .toHaveClass("side-tabs")
    expect(screen.getByRole("tab", { name: "Needs" })).toBeVisible()
    expect(screen.getAllByRole("tab")).toHaveLength(2)
    expect(screen.queryByRole("tab", { name: "History" })).not.toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Proposed schedule" })).toHaveAttribute(
      "href",
      "/schedule",
    )
    expect(screen.queryByRole("button", { name: "Open menu" }))
      .not.toBeInTheDocument()
    await waitFor(() =>
      expect(
        screen.queryByText("Manual mode · open in ChatGPT or enable Chrome WebMCP"),
      ).not.toBeInTheDocument(),
    )
    expect(screen.queryByText("REV 06")).not.toBeInTheDocument()
  })

  it("keeps the selected workspace in the browser route", async () => {
    window.history.replaceState(null, "", "/needs")
    render(<App registration={registration(false)} store={store()} />)

    expect(screen.getByRole("tab", { name: "Needs" })).toHaveAttribute(
      "aria-selected",
      "true",
    )

    fireEvent.click(screen.getByRole("tab", { name: "Proposed schedule" }))
    expect(window.location.pathname).toBe("/schedule")
    expect(screen.getByTestId("stop-gravel-loop")).toBeInTheDocument()

    window.history.back()
    await waitFor(() =>
      expect(screen.getByRole("tab", { name: "Needs" })).toHaveAttribute(
        "aria-selected",
        "true",
      ),
    )
  })

  it("explains the plan interaction in the blank state", () => {
    render(<App registration={registration(false)} store={blankStore()} />)

    expect(screen.getByText(/Drag any unlocked item to reorder it/)).toBeVisible()
    expect(screen.getByText(/Open the complete proposal in Google Maps/))
      .toBeVisible()
  })

  it("reveals one add field from its contextual plus", () => {
    const missionStore = blankStore()
    render(<App registration={registration(false)} store={missionStore} />)

    expect(
      screen.queryByRole("textbox", { name: "Add item" }),
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Add item" }))
    const addItem = screen.getByRole("textbox", { name: "Add item" })
    expect(addItem).toHaveFocus()

    fireEvent.change(addItem, { target: { value: "Call the hotel" } })
    fireEvent.keyDown(addItem, { key: "Enter" })

    expect(missionStore.getSnapshot().stops).toContainEqual(
      expect.objectContaining({ title: "Call the hotel" }),
    )
    expect(
      screen.queryByRole("textbox", { name: "Add item" }),
    ).not.toBeInTheDocument()
  })

  it("opens one complete item action menu", async () => {
    render(<App registration={registration(false)} store={store()} />)

    expect(
      screen.queryByRole("button", { name: "Delete item" }),
    ).not.toBeInTheDocument()
    fireEvent.click(
      screen.getByRole("button", { name: "Actions for Forest gravel loop" }),
    )
    expect(
      screen.queryByRole("button", { name: "Mark Forest gravel loop done" }),
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Show item actions" }))

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Mark Forest gravel loop done" }))
        .toBeVisible(),
    )
    expect(screen.getByRole("button", { name: "Skip Forest gravel loop" }))
      .toBeVisible()
    expect(screen.getByRole("button", { name: "Lock Forest gravel loop" }))
      .toBeVisible()
    expect(screen.getByRole("button", { name: "Delete item" })).toBeVisible()
    expect(
      screen.queryByRole("button", { name: "Unlock Dinner reservation" }),
    ).not.toBeInTheDocument()

    fireEvent.click(
      screen.getByRole("button", { name: "Actions for Dinner reservation" }),
    )
    expect(screen.getByRole("button", { name: "Hide item actions" })).toBeVisible()
    expect(
      screen.queryByRole("button", { name: "Lock Forest gravel loop" }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Unlock Dinner reservation" }))
      .toBeVisible()
  })

  it("opens inline editing from the collapsed title", () => {
    render(<App registration={registration(false)} store={store()} />)

    expect(
      screen.queryByRole("textbox", {
        name: "Edit item title: Forest gravel loop",
      }),
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Forest gravel loop" }))

    expect(
      screen.getByRole("button", { name: "Actions for Forest gravel loop" }),
    ).toHaveAttribute("aria-expanded", "true")
    expect(
      screen.getByRole("textbox", {
        name: "Edit item title: Forest gravel loop",
      }),
    ).toHaveFocus()

    fireEvent.click(screen.getByRole("button", { name: "Biokovo sunset hike" }))
    expect(
      screen.queryByRole("textbox", {
        name: "Edit item title: Forest gravel loop",
      }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole("textbox", {
        name: "Edit item title: Biokovo sunset hike",
      }),
    ).toBeVisible()
  })

  it("deletes an item from its action menu", () => {
    const missionStore = store()
    vi.spyOn(window, "confirm").mockReturnValue(true)
    render(<App registration={registration(false)} store={missionStore} />)

    fireEvent.click(
      screen.getByRole("button", { name: "Actions for Biokovo sunset hike" }),
    )
    fireEvent.click(screen.getByRole("button", { name: "Show item actions" }))
    fireEvent.click(screen.getByRole("button", { name: "Delete item" }))

    expect(
      missionStore.getSnapshot().stops.some((stop) => stop.id === "biokovo-hike"),
    ).toBe(false)
    expect(screen.queryByTestId("stop-biokovo-hike")).not.toBeInTheDocument()
  })

  it("keeps one focused workspace with explicit controls", () => {
    const missionStore = store()
    render(<App registration={registration(false)} store={missionStore} />)

    expect(screen.getByRole("tab", { name: "Proposed schedule" })).toHaveAttribute(
      "aria-selected",
      "true",
    )

    const activeStop = within(screen.getByTestId("stop-gravel-loop"))
    expect(
      activeStop.queryByRole("button", { name: "Mark Forest gravel loop done" }),
    ).not.toBeInTheDocument()
    fireEvent.click(
      activeStop.getByRole("button", { name: "Actions for Forest gravel loop" }),
    )
    const openActiveStop = within(screen.getByTestId("stop-gravel-loop"))
    fireEvent.click(
      openActiveStop.getByRole("button", { name: "Show item actions" }),
    )
    expect(openActiveStop.getByRole("button", { name: "Mark Forest gravel loop done" }))
      .toHaveTextContent("Mark done")
    expect(
      openActiveStop.getByRole("link", {
        name: "Open in Google Maps: Forest gravel loop",
      }),
    ).toBeVisible()
    const plannedStop = within(screen.getByTestId("stop-biokovo-hike"))
    expect(
      plannedStop.queryByRole("button", {
        name: "Mark Biokovo sunset hike done",
      }),
    ).not.toBeInTheDocument()

    fireEvent.click(
      plannedStop.getByRole("button", { name: "Actions for Biokovo sunset hike" }),
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

    expect(screen.queryByRole("tab", { name: "Route" })).not.toBeInTheDocument()
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

    fireEvent.click(screen.getByRole("tab", { name: "Needs" }))

    expect(
      screen.getByRole("textbox", { name: "Edit need: dog with us" }).closest("li"),
    ).toHaveAttribute("data-draggable", "true")
  })

  it("exposes stop locks as explicit controls", () => {
    const missionStore = store()
    render(<App registration={registration(false)} store={missionStore} />)

    fireEvent.click(
      screen.getByRole("button", { name: "Actions for Dinner reservation" }),
    )
    fireEvent.click(screen.getByRole("button", { name: "Show item actions" }))
    expect(screen.getByRole("button", { name: "Unlock Dinner reservation" }))
      .toBeInTheDocument()

    fireEvent.click(
      screen.getByRole("button", { name: "Actions for Biokovo sunset hike" }),
    )
    fireEvent.click(screen.getByRole("button", { name: "Lock Biokovo sunset hike" }))

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

    fireEvent.click(screen.getByRole("tab", { name: "Needs" }))
    fireEvent.click(screen.getByRole("button", { name: "Add need" }))
    fireEvent.change(screen.getByRole("textbox", { name: "New need" }), {
      target: { value: "avoid steep climbs" },
    })
    fireEvent.keyDown(screen.getByRole("textbox", { name: "New need" }), {
      key: "Enter",
    })

    expect(screen.getByDisplayValue("avoid steep climbs")).toBeInTheDocument()
    expect(missionStore.getSnapshot().context.constraints).toContainEqual(
      expect.objectContaining({ label: "avoid steep climbs", status: "active" }),
    )

    fireEvent.click(screen.getByRole("button", { name: "Cross out dog with us" }))

    expect(
      screen.getByRole("textbox", { name: "Edit need: dog with us" }).closest("li"),
    ).toHaveAttribute("data-status", "crossed")
  })

  it("adds and renames plan items inline", () => {
    const missionStore = store()
    render(<App registration={registration(false)} store={missionStore} />)

    fireEvent.click(screen.getByRole("button", { name: "Forest gravel loop" }))
    const title = screen.getByRole("textbox", {
      name: "Edit item title: Forest gravel loop",
    })
    fireEvent.change(title, { target: { value: "Coastal gravel loop" } })
    fireEvent.blur(title)

    expect(missionStore.getSnapshot().stops[0]?.title).toBe(
      "Coastal gravel loop",
    )

    fireEvent.click(screen.getByRole("button", { name: "Add item" }))
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

    await waitFor(() =>
      expect(
        screen.queryByText("Manual mode · open in ChatGPT or enable Chrome WebMCP"),
      ).not.toBeInTheDocument(),
    )
    fireEvent.click(
      screen.getByRole("button", { name: "Actions for Forest gravel loop" }),
    )
    fireEvent.click(screen.getByRole("button", { name: "Show item actions" }))
    fireEvent.click(
      screen.getByRole("button", { name: "Mark Forest gravel loop done" }),
    )

    expect(missionStore.getSnapshot().revision).toBe(7)
    expect(screen.getByTestId("stop-gravel-loop")).toHaveTextContent("Completed")
    expect(missionStore.getSnapshot().events[0]?.actor).toBe("human")
    expect(
      screen.queryByRole("link", {
        name: "Open in Google Maps: Forest gravel loop",
      }),
    ).not.toBeInTheDocument()
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
      screen.getByRole("button", { name: "Actions for Punta Rata swim & snorkel" }),
    )
    const source = screen.getByRole("link", { name: /Punta Rata — TZ Brela/ })

    expect(source).toHaveAttribute(
      "href",
      "https://brela.hr/en/beaches/the-punta-rata-beach",
    )
    expect(source).toHaveAttribute("target", "_blank")
    expect(source).toHaveAttribute("rel", "noopener noreferrer")
  })

  it("loads the demo again after starting a new plan", () => {
    const missionStore = createMissionStore({
      id: () => "ui-id",
      mission: PALERMO_ARRIVAL_MISSION,
      storage,
    })
    vi.spyOn(window, "confirm").mockReturnValue(true)
    render(<App registration={registration(false)} store={missionStore} />)

    fireEvent.click(screen.getByRole("button", { name: "New plan" }))

    fireEvent.click(screen.getByRole("button", { name: "Load demo" }))
    fireEvent.click(screen.getByRole("menuitem", { name: /Palermo arrival/ }))
    expect(missionStore.getSnapshot().revision).toBe(0)
    expect(screen.getByRole("textbox", { name: "What you need" }))
      .toHaveValue(PALERMO_ARRIVAL_MISSION.context.brief)
    expect(window.confirm).not.toHaveBeenCalled()
  })

  it("keeps confirmation when a sample would replace a personal plan", () => {
    const missionStore = blankStore()
    missionStore.dispatch({
      type: "SetTitle",
      value: {
        actor: "human",
        input: { expectedRevision: 0, title: "My afternoon" },
      },
    })
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false)
    render(<App registration={registration(false)} store={missionStore} />)

    fireEvent.click(screen.getByRole("button", { name: "Load demo" }))
    fireEvent.click(screen.getByRole("menuitem", { name: /Palermo arrival/ }))

    expect(confirm).toHaveBeenCalledOnce()
    expect(missionStore.getSnapshot()).toMatchObject({
      id: "personal-plan",
      title: "My afternoon",
    })
  })

  it("starts a new plan without confirmation and copies selected demo Needs", async () => {
    const missionStore = createMissionStore({
      id: () => "ui-id",
      mission: PALERMO_ARRIVAL_MISSION,
      storage,
    })
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    })
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false)
    render(<App registration={registration(true)} store={missionStore} />)

    fireEvent.click(screen.getByRole("tab", { name: "Needs" }))
    fireEvent.click(
      screen.getByRole("button", {
        name: "Copy needs for ChatGPT",
      }),
    )

    await waitFor(() => expect(writeText).toHaveBeenCalledOnce())
    const prompt = writeText.mock.calls[0]?.[0]
    expect(prompt).toContain('"missionId": "palermo-arrival-demo"')
    expect(prompt).toContain('"title": "Palermo arrival"')
    expect(prompt).toContain("Hotel Trinacria")
    expect(prompt).not.toContain('"stops"')
    expect(prompt).not.toContain('"events"')

    fireEvent.click(screen.getByRole("button", { name: "New plan" }))
    expect(confirm).not.toHaveBeenCalled()
    expect(missionStore.getSnapshot().stops).toEqual([])
  })
})
