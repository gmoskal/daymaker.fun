import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { App } from "./App"
import {
  PALERMO_ARRIVAL_MISSION,
  SEED_MISSION,
  createBlankMission,
} from "./domain/seed"
import { readSessionUrl } from "./session-link"
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
const readyEmptyPlanStore = () => {
  const mission = createBlankMission(new Date("2026-09-03T10:15:00Z"), "UTC")
  mission.context.stage = "needs"
  mission.title = "Draft plan"
  return createMissionStore({ id: () => "ui-id", mission, storage })
}
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
    expect(screen.queryByText("Untitled plan")).not.toBeInTheDocument()
    expect(screen.queryByRole("tab", { name: "Route" })).not.toBeInTheDocument()
    const proposed = screen.getByRole("tab", { name: "Proposed schedule" })
    expect(proposed).toHaveAttribute("aria-disabled", "true")
    fireEvent.click(proposed)
    expect(window.location.pathname).toBe("/needs")
    expect(screen.queryByRole("region")).not.toBeInTheDocument()
    expect(screen.queryByText("Unknown")).not.toBeInTheDocument()
  })

  it("copies editable Needs for the agent", async () => {
    window.history.replaceState(null, "", "/needs")
    const missionStore = blankStore()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    })
    render(<App registration={registration(true)} store={missionStore} />)

    const brief = screen.getByRole("textbox", {
      name: "1 · Describe your needs",
    })
    expect(brief).toBeRequired()
    expect(screen.getByRole("button", { name: "Copy to ChatGPT" }))
      .toBeDisabled()
    fireEvent.change(brief, {
      target: { value: "Find a calm swim and keep dinner fixed." },
    })
    fireEvent.blur(brief)
    fireEvent.click(screen.getByRole("button", { name: "Copy to ChatGPT" }))

    await waitFor(() => expect(writeText).toHaveBeenCalledOnce())
    const prompt = writeText.mock.calls[0]?.[0]
    expect(prompt).toContain("Find a calm swim and keep dinner fixed.")
    expect(prompt).toContain('"lockedCommitments"')
    expect(prompt).not.toContain('"needs"')
    expect(prompt).not.toContain('"stops"')
  })

  it("edits all forms of Needs", () => {
    window.history.replaceState(null, "", "/needs")
    const missionStore = store()
    render(<App registration={registration(false)} store={missionStore} />)

    expect(screen.queryByRole("textbox", { name: "1 · Describe your needs" }))
      .not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Copy changes to ChatGPT" }))
      .toBeDisabled()
    fireEvent.click(
      screen.getByRole("button", { name: "Make dog with us non-negotiable" }),
    )
    expect(
      missionStore.getSnapshot().context.constraints.find(
        (need) => need.id === "constraint-dog",
      ),
    ).toMatchObject({ fixed: true })
    expect(screen.getByRole("button", { name: "Copy changes to ChatGPT" }))
      .toBeEnabled()

    fireEvent.click(screen.getByRole("button", { name: "Remove dog with us" }))
    expect(
      missionStore.getSnapshot().context.constraints.some(
        (need) => need.id === "constraint-dog",
      ),
    ).toBe(false)
  })

  it("explains whether each Need must be kept or can adapt", () => {
    window.history.replaceState(null, "", "/needs")
    const missionStore = store()
    render(<App registration={registration(false)} store={missionStore} />)

    const makeRequired = screen.getByRole("button", {
      name: "Make dog with us non-negotiable",
    })
    expect(makeRequired).toHaveTextContent("Can adapt")
    fireEvent.click(makeRequired)

    expect(
      screen.getByRole("button", { name: "Allow dog with us to adapt" }),
    ).toHaveTextContent("Must keep")
    expect(
      missionStore.getSnapshot().context.constraints.find(
        (need) => need.id === "constraint-dog",
      ),
    ).toMatchObject({ fixed: true })
    expect(screen.getByRole("button", { name: "Copy changes to ChatGPT" }))
      .toBeEnabled()
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

  it("exposes maps from every located schedule item", async () => {
    window.history.replaceState(null, "", "/schedule")
    render(<App registration={registration(false)} store={store()} />)

    fireEvent.click(screen.getByRole("button", { name: "Forest gravel loop" }))

    await waitFor(() =>
      expect(
        screen.getByRole("link", {
          name: "Open in Google Maps: Forest gravel loop",
        }),
      ).toBeVisible(),
    )
    expect(
      screen.getByRole("link", {
        name: "Open in Apple Maps: Forest gravel loop",
      }),
    ).toBeVisible()
    expect(
      screen.getByRole("link", { name: "Open proposed schedule in Google Maps" }),
    ).toBeVisible()
    const date = screen.getByRole("region", {
      name: "Sunday, 30 August 2026",
    })
    expect(within(date).getByText("Baška Voda")).toBeVisible()
    expect(within(date).queryByText("15:10")).not.toBeInTheDocument()
  })

  it("refreshes the footer after an accepted human update", () => {
    window.history.replaceState(null, "", "/needs")
    const mission = createBlankMission(
      new Date("2026-09-03T13:23:00.000Z"),
      "Europe/Warsaw",
    )
    const params = {
      id: () => "ui-id",
      mission,
      now: () => new Date("2026-09-03T13:42:00.000Z"),
      storage,
    }
    const missionStore = createMissionStore(params)
    const { container } = render(
      <App registration={registration(false)} store={missionStore} />,
    )
    const marker = container.querySelector(".release-marker")
    const before = marker?.textContent

    fireEvent.change(
      screen.getByRole("textbox", { name: "1 · Describe your needs" }),
      { target: { value: "Plan one calm afternoon." } },
    )
    fireEvent.blur(
      screen.getByRole("textbox", { name: "1 · Describe your needs" }),
    )

    expect(marker).toBeVisible()
    expect(marker?.textContent).not.toBe(before)
    expect(marker?.textContent).toContain("15:42 CEST")
  })

  it("copies a complete session link from the footer", async () => {
    const missionStore = store()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    })
    render(<App registration={registration(true)} store={missionStore} />)

    fireEvent.click(screen.getByRole("button", { name: "Copy session link" }))

    await waitFor(() => expect(writeText).toHaveBeenCalledOnce())
    const link = writeText.mock.calls[0]?.[0] as string
    expect(new URL(link).pathname).toBe("/schedule")
    await expect(readSessionUrl({ url: link })).resolves.toEqual({
      mission: missionStore.getSnapshot(),
      type: "loaded",
    })
    expect(
      screen.getByRole("button", { name: "Session link copied" }),
    ).toBeVisible()
  })

  it("starts with Proposed schedule disabled and keeps the demo optional", () => {
    const missionStore = blankStore()
    vi.spyOn(window, "confirm").mockReturnValue(true)
    render(<App registration={registration(false)} store={missionStore} />)

    expect(window.location.pathname).toBe("/needs")
    expect(screen.getByRole("tab", { name: "Proposed schedule" }))
      .toHaveAttribute("aria-disabled", "true")
    expect(screen.getByRole("button", { name: "Copy to ChatGPT" }))
      .toBeDisabled()

    fireEvent.click(screen.getByRole("button", { name: "Load demo" }))
    fireEvent.click(screen.getByRole("menuitem", { name: /Palermo arrival/ }))
    expect(
      screen.getByRole("textbox", { name: "1 · Describe your needs" }),
    )
      .toHaveValue(PALERMO_ARRIVAL_MISSION.context.brief)
    expect(missionStore.getSnapshot().context.constraints).toEqual([])

    fireEvent.click(screen.getByRole("button", { name: "New plan" }))
    expect(missionStore.getSnapshot().stops).toEqual([])
    expect(
      screen.getByRole("textbox", { name: "1 · Describe your needs" }),
    ).toHaveValue("")
  })

  it("loads a selected sample from the demo menu", () => {
    const missionStore = blankStore()
    render(<App registration={registration(false)} store={missionStore} />)

    fireEvent.click(screen.getByRole("button", { name: "Load demo" }))
    expect(screen.getByRole("menu", { name: "Sample plans" })).toBeVisible()
    expect(screen.getAllByRole("menuitem")).toHaveLength(2)
    fireEvent.click(screen.getByRole("menuitem", { name: /Palermo arrival/ }))

    expect(missionStore.getSnapshot().title).toBe("Palermo arrival")
    expect(
      screen.getByRole("textbox", { name: "1 · Describe your needs" }),
    )
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
    render(<App registration={registration(false)} store={readyEmptyPlanStore()} />)

    expect(screen.getByText(/generated from Needs/)).toBeVisible()
    expect(screen.getByText(/Open the complete proposal in Google Maps/))
      .toBeVisible()
  })

  it("keeps Proposed schedule read-only and independently expands whole rows", async () => {
    const missionStore = store()
    render(<App registration={registration(false)} store={missionStore} />)

    const gravel = screen.getByTestId("stop-gravel-loop")
    const hike = screen.getByTestId("stop-biokovo-hike")
    expect(within(gravel).getByText("Bike parking, Baška Voda")).toBeVisible()
    expect(within(hike).getByText("Biokovo trailhead")).toBeVisible()
    expect(within(gravel).queryByText("Active")).not.toBeInTheDocument()
    expect(within(hike).queryByText("Planned")).not.toBeInTheDocument()
    expect(gravel).not.toHaveAttribute("data-draggable")
    expect(screen.queryByRole("button", { name: "Add item" }))
      .not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Show item actions" }))
      .not.toBeInTheDocument()
    expect(screen.queryByRole("textbox", { name: "Board title" }))
      .not.toBeInTheDocument()

    fireEvent.click(within(gravel).getByText("11:30"))
    expect(
      within(gravel).getByRole("button", { name: "Forest gravel loop" }),
    ).toHaveAttribute("aria-expanded", "true")
    await waitFor(() =>
      expect(within(gravel).getByText(/shaded gravel loop/)).toBeVisible(),
    )

    fireEvent.click(within(hike).getByText("Biokovo sunset hike"))
    expect(
      within(gravel).getByRole("button", { name: "Forest gravel loop" }),
    ).toHaveAttribute("aria-expanded", "true")
    expect(
      within(hike).getByRole("button", { name: "Biokovo sunset hike" }),
    ).toHaveAttribute("aria-expanded", "true")

    fireEvent.click(within(gravel).getByText("Bike parking, Baška Voda"))
    expect(
      within(gravel).getByRole("button", { name: "Forest gravel loop" }),
    ).toHaveAttribute("aria-expanded", "false")
    await waitFor(() =>
      expect(within(hike).getByText(/steep sunset hike/)).toBeVisible(),
    )
    expect(missionStore.getSnapshot().revision).toBe(6)
  })

  it("keeps Needs draggable", () => {
    const missionStore = store()
    render(<App registration={registration(false)} store={missionStore} />)

    fireEvent.click(screen.getByRole("tab", { name: "Needs" }))

    expect(
      screen.getByRole("textbox", { name: "Edit need: dog with us" }).closest("li"),
    ).toHaveAttribute("data-draggable", "true")
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

  it("adds a Need from an item-shaped inline row", () => {
    window.history.replaceState(null, "", "/needs")
    const missionStore = store()
    render(<App registration={registration(false)} store={missionStore} />)

    const add = screen.getByRole("button", { name: "Add need" })
    expect(add.closest(".need-add-row")).not.toBeNull()
    fireEvent.click(add)

    const input = screen.getByRole("textbox", { name: "New need" })
    expect(input.closest(".need-add-row")).toBe(add.closest(".need-add-row"))
    fireEvent.change(input, { target: { value: "quiet place for lunch" } })
    fireEvent.keyDown(input, { key: "Enter" })

    expect(missionStore.getSnapshot().context.constraints).toContainEqual(
      expect.objectContaining({ label: "quiet place for lunch" }),
    )
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
      screen.getByRole("button", { name: "Punta Rata swim & snorkel" }),
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
    expect(
      screen.getByRole("textbox", { name: "1 · Describe your needs" }),
    )
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
        name: "Copy to ChatGPT",
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
