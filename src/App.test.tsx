import { fireEvent, render, screen, waitFor } from "@testing-library/react"
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
  it("uses the shared store for a human Done action", async () => {
    const missionStore = store()
    render(<App registration={registration(false)} store={missionStore} />)

    await waitFor(() =>
      expect(
        screen.getByText("Manual mode · open in ChatGPT or enable Chrome WebMCP"),
      ).toBeInTheDocument(),
    )
    fireEvent.click(
      screen.getByRole("button", { name: "Mark Forest gravel loop done" }),
    )

    expect(screen.getByText("REV 07")).toBeInTheDocument()
    expect(screen.getByTestId("stop-gravel-loop")).toHaveTextContent("Completed")
    expect(screen.getByLabelText("Activity log")).toHaveTextContent("Human")
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

    fireEvent.click(screen.getByRole("button", { name: "Reset demo" }))

    expect(screen.getByText("REV 06")).toBeInTheDocument()
    expect(screen.getByTestId("stop-gravel-loop")).toHaveTextContent("Active")
    expect(window.confirm).toHaveBeenCalledOnce()
  })
})
