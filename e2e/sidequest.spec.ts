import { expect, test, type Page } from "@playwright/test"

type ToolOutcome = {
  changed?: { stopId?: string }
  ok: boolean
  revision: number
}

const installWebMcpHarness = async (page: Page) => {
  await page.addInitScript(() => {
    localStorage.clear()
    const registered = new Map<string, { execute: (input: unknown) => unknown }>()
    Object.assign(window, { __sidequestTools: registered })
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: {
        registerTool: (
          definition: { execute: (input: unknown) => unknown; name: string },
          options?: { signal?: AbortSignal },
        ) => {
          if (options?.signal?.aborted === true) throw new Error("Registration aborted")
          registered.set(definition.name, definition)
          options?.signal?.addEventListener(
            "abort",
            () => registered.delete(definition.name),
            { once: true },
          )
        },
      },
    })
  })
}

const executeTool = (page: Page, name: string, input: unknown) =>
  page.evaluate(
    async ({ input, name }) => {
      const registered = (
        window as typeof window & {
          __sidequestTools: Map<string, { execute: (value: unknown) => unknown }>
        }
      ).__sidequestTools
      const definition = registered.get(name)
      if (definition === undefined) throw new Error(`Missing tool ${name}`)
      return definition.execute(input)
    },
    { input, name },
  ) as Promise<ToolOutcome>

test("completes and captures the Sidequest killer flow", async ({ page }) => {
  await installWebMcpHarness(page)
  await page.setViewportSize({ height: 900, width: 1440 })
  await page.goto("/")

  await expect(page.getByText("Site tools connected")).toBeVisible()
  await expect(page.getByText("REV 06")).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as typeof window & { __sidequestTools: Map<string, unknown> }
          ).__sidequestTools.size,
      ),
    )
    .toBe(5)

  await page.getByRole("button", { name: "Mark Forest gravel loop done" }).click()
  await expect(page.getByText("REV 07")).toBeVisible()

  expect(
    await executeTool(page, "update_day_context", {
      constraints: [
        "car available",
        "dog with us",
        "max 20 min drive",
        "keep dinner at 18:30",
      ],
      currentLocation: {
        label: "Bike parking, Baška Voda",
        lat: 43.3569,
        lng: 16.9502,
      },
      currentTime: "2026-08-30T15:10:00+02:00",
      energy: "low",
      expectedRevision: 7,
      reason: "The ride used more energy than expected.",
    }),
  ).toMatchObject({ ok: true, revision: 8 })

  expect(
    await executeTool(page, "update_mission_stop", {
      expectedRevision: 8,
      reason: "A steep hike no longer fits the group's energy.",
      status: "skipped",
      stopId: "biokovo-hike",
    }),
  ).toMatchObject({ ok: true, revision: 9 })

  const swim = await executeTool(page, "add_mission_stop", {
    durationMinutes: 65,
    expectedRevision: 9,
    kind: "activity",
    location: { label: "Punta Rata Beach, Brela", lat: 43.3692, lng: 16.9221 },
    rationale: "A relaxed swim fits low energy and keeps the drive short.",
    source: {
      checkedAt: "2026-08-30T15:11:00+02:00",
      title: "Punta Rata — Brela Tourist Board",
      url: "https://brela.hr/en/beaches/the-punta-rata-beach",
    },
    startsAt: "2026-08-30T15:30:00+02:00",
    title: "Punta Rata swim & snorkel",
    travelMinutesFromPrevious: 12,
  })
  expect(swim).toMatchObject({ ok: true, revision: 10 })

  const fuel = await executeTool(page, "add_mission_stop", {
    durationMinutes: 15,
    expectedRevision: 10,
    kind: "service",
    location: { label: "INA Baška Voda", lat: 43.3586, lng: 16.9508 },
    rationale: "A quick fuel stop is on the return path and protects dinner.",
    source: {
      checkedAt: "2026-08-30T15:12:00+02:00",
      title: "INA station finder",
      url: "https://www.ina.hr/en/station-search/",
    },
    startsAt: "2026-08-30T16:50:00+02:00",
    title: "Fuel stop · INA",
    travelMinutesFromPrevious: 15,
  })
  expect(fuel).toMatchObject({ ok: true, revision: 11 })

  const swimId = swim.changed?.stopId
  const fuelId = fuel.changed?.stopId
  expect(swimId).toBeTruthy()
  expect(fuelId).toBeTruthy()
  expect(
    await executeTool(page, "reorder_mission_stops", {
      expectedRevision: 11,
      orderedStops: [
        { startsAt: "2026-08-30T15:30:00+02:00", stopId: swimId },
        { startsAt: "2026-08-30T16:50:00+02:00", stopId: fuelId },
        { startsAt: "2026-08-30T17:15:00+02:00", stopId: "return-shower" },
        { startsAt: "2026-08-30T18:30:00+02:00", stopId: "dinner" },
      ],
      reason: "Swim, fuel, reset, and keep the dinner reservation.",
    }),
  ).toMatchObject({ ok: true, revision: 12 })

  await expect(page.getByText("REV 12")).toBeVisible()
  await expect(page.getByTestId("stop-biokovo-hike")).toContainText("Skipped")
  await expect(page.getByText("Punta Rata swim & snorkel").first()).toBeVisible()
  await expect(page.getByText("Fuel stop · INA").first()).toBeVisible()
  await expect(page.getByTestId("stop-dinner")).toContainText("18:30")
  await expect(page.getByLabel("Activity log")).toContainText("Agent")

  await page.screenshot({ fullPage: true, path: "artifacts/sidequest-desktop.png" })
  await page.setViewportSize({ height: 844, width: 390 })
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(390)
  await page.screenshot({ fullPage: true, path: "artifacts/sidequest-mobile.png" })
})
