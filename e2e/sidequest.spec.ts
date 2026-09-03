import { expect, test, type Locator, type Page } from "@playwright/test"

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

const loadDemo = async (page: Page) => {
  await page.getByRole("button", { name: "Load demo" }).click()
  await page.getByRole("menuitem", { name: /Baška Voda/ }).click()
}

test("opens the flat demo catalog without viewport overflow", async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 })
  await page.goto("/")
  await page.getByRole("button", { name: "Load demo" }).click()

  await expect(page.getByRole("menu", { name: "Sample plans" })).toBeVisible()
  await expect(page.getByRole("menuitem", { name: /San Francisco/ })).toBeVisible()
  await expect(page.getByRole("menuitem", { name: /Barcelona/ })).toBeVisible()
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(390)
  await page.screenshot({ fullPage: true, path: "artifacts/sidequest-demo-menu.png" })
})

const dragTo = async (page: Page, handle: Locator, target: Locator) => {
  const sourceBox = await handle.boundingBox()
  const targetBox = await target.boundingBox()
  if (sourceBox === null || targetBox === null)
    throw new Error("Drag targets must be visible")

  await page.mouse.move(
    sourceBox.x + Math.min(12, sourceBox.width / 2),
    sourceBox.y + sourceBox.height / 2,
  )
  await page.mouse.down()
  await page.mouse.move(
    targetBox.x + targetBox.width / 2,
    targetBox.y + Math.min(10, targetBox.height / 2),
    { steps: 18 },
  )
  await page.mouse.up()
}

test("preserves readable schedule hierarchy and one item menu", async ({ page }) => {
  await installWebMcpHarness(page)
  await page.setViewportSize({ height: 720, width: 780 })
  await page.goto("/")
  await loadDemo(page)

  const day = page.locator(".date-block > strong")
  const firstItem = page.getByTestId("stop-gravel-loop")
  await page.getByRole("button", { name: "Actions for Forest gravel loop" }).click()
  await page.getByRole("button", { name: "Show item actions" }).click()
  const time = firstItem.locator("time")
  const daySize = await day.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).fontSize),
  )
  const timeStyle = await time.evaluate((element) => {
    const style = getComputedStyle(element)
    return {
      color: style.color,
      letterSpacing: Number.parseFloat(style.letterSpacing),
      size: Number.parseFloat(style.fontSize),
    }
  })
  const timeline = await page.locator(".stop-list").evaluate((element) => {
    const axis = getComputedStyle(element, "::before")
    const row = getComputedStyle(element.querySelector(".stop-row")!, "::after")
    const status = getComputedStyle(element.querySelector(".status")!)
    const time = getComputedStyle(element.querySelector("time")!)
    return {
      axisContent: axis.content,
      axisWidth: axis.width,
      rowContent: row.content,
      statusColumn: status.gridColumnStart,
      timeAlign: time.textAlign,
    }
  })

  expect(daySize).toBeLessThanOrEqual(72)
  expect(timeStyle).toMatchObject({ color: "rgb(210, 31, 43)" })
  expect(timeStyle.size).toBeGreaterThanOrEqual(16)
  expect(timeStyle.letterSpacing).toBeGreaterThanOrEqual(0.5)
  expect(timeline).toEqual({
    axisContent: '""',
    axisWidth: "1px",
    rowContent: "none",
    statusColumn: "2",
    timeAlign: "right",
  })
  await expect(page.getByRole("tablist", { name: "Mission views" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Open menu" })).toHaveCount(0)
  await expect(page.getByText(/Manual mode/)).toHaveCount(0)
  await expect(page.getByText(/REV 06/)).toHaveCount(0)
  await expect(page.getByRole("button", { name: "Delete item" })).toBeVisible()
  expect(
    await page
      .getByRole("button", { name: "Mark Forest gravel loop done" })
      .evaluate((element) => getComputedStyle(element).color),
  ).toBe("rgb(146, 146, 151)")
  await page.screenshot({
    fullPage: true,
    path: "artifacts/sidequest-item-menu.png",
  })
})

test("completes and captures the Sidequest killer flow", async ({ page }) => {
  await installWebMcpHarness(page)
  await page.setViewportSize({ height: 900, width: 1440 })
  await page.goto("/")

  await expect(page.getByText(/Drag any unlocked item to reorder it/)).toBeVisible()
  await loadDemo(page)
  await expect(page.getByRole("tab", { name: "Plan" })).toHaveAttribute(
    "aria-selected",
    "true",
  )
  await page.getByRole("button", { name: "Actions for Forest gravel loop" }).click()
  await page.getByRole("button", { name: "Show item actions" }).click()
  await expect(page.getByRole("button", { name: "Mark Forest gravel loop done" }))
    .toHaveText("Mark done")
  await expect(page.getByTestId("stop-biokovo-hike")).toHaveAttribute(
    "data-draggable",
    "true",
  )
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
      replacePlan: false,
      timezone: "Europe/Zagreb",
      title: "Baška Voda Adventure",
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

  await expect(page.getByTestId("stop-biokovo-hike")).toContainText("Skipped")
  await expect(
    page.getByRole("button", { name: "Punta Rata swim & snorkel", exact: true }),
  ).toBeVisible()
  await expect(page.getByText("Fuel stop · INA").first()).toBeVisible()
  await expect(page.getByTestId("stop-dinner")).toContainText("18:30")
  await page.getByRole("tab", { name: "Route" }).click()
  await expect(page).toHaveURL(/\/route$/)
  await expect(
    page.getByRole("link", { name: "Open full plan in Google Maps" }),
  ).toBeVisible()
  await page.goBack()
  await expect(page).toHaveURL(/\/plan$/)

  await page.screenshot({ fullPage: true, path: "artifacts/sidequest-desktop.png" })
  await page.setViewportSize({ height: 844, width: 390 })
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(390)
  await page.screenshot({ fullPage: true, path: "artifacts/sidequest-mobile.png" })
})

test("edits and reorders the human operational lists", async ({ page }) => {
  await installWebMcpHarness(page)
  await page.setViewportSize({ height: 900, width: 1100 })
  await page.goto("/")
  await loadDemo(page)

  expect(
    await page
      .getByRole("button", { name: "Return & shower", exact: true })
      .evaluate((element) => getComputedStyle(element).cursor),
  ).toBe("grab")

  await dragTo(
    page,
    page.getByRole("button", { name: "Return & shower", exact: true }),
    page.getByRole("button", { name: "Biokovo sunset hike", exact: true }),
  )

  await expect
    .poll(() =>
      page
        .locator('[data-testid^="stop-"]')
        .evaluateAll((stops) => stops.map((stop) => stop.getAttribute("data-testid"))),
    )
    .toEqual([
      "stop-gravel-loop",
      "stop-return-shower",
      "stop-biokovo-hike",
      "stop-dinner",
    ])
  await expect(page.getByTestId("stop-dinner")).toHaveAttribute(
    "data-draggable",
    "false",
  )
  await expect(page.getByTestId("stop-dinner")).toContainText("18:30")

  await page.getByRole("tab", { name: "Context" }).click()
  await page.getByRole("button", { name: "Add requirement" }).click()
  await page.getByRole("textbox", { name: "New requirement" }).fill(
    "avoid steep climbs",
  )
  await page.getByRole("textbox", { name: "New requirement" }).press("Enter")
  await page.getByRole("button", { name: "Cross out dog with us" }).click()
  await expect(
    page.getByRole("textbox", { name: "Edit requirement: dog with us" }).locator(".."),
  ).toHaveAttribute("data-status", "crossed")

  await dragTo(
    page,
    page.getByRole("textbox", { name: "Edit requirement: avoid steep climbs" }).locator(".."),
    page.getByRole("textbox", { name: "Edit requirement: car available" }).locator(".."),
  )
  await expect
    .poll(() =>
      page
        .locator(".constraint-list .inline-editor")
        .evaluateAll((inputs) =>
          inputs.map((input) => (input as HTMLInputElement).value),
        ),
    )
    .toEqual([
      "avoid steep climbs",
      "car available",
      "dog with us",
      "max 20 min drive",
      "keep dinner at 18:30",
    ])
})

test("copies complete demo context and starts fresh without an app modal", async ({
  context,
  page,
}) => {
  await installWebMcpHarness(page)
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: "http://127.0.0.1:4173",
  })
  await page.setViewportSize({ height: 844, width: 390 })
  let dialogCount = 0
  page.on("dialog", async (dialog) => {
    dialogCount += 1
    await dialog.dismiss()
  })
  await page.goto("/")
  await loadDemo(page)
  await page.getByRole("tab", { name: "Context" }).click()
  await page.getByRole("button", {
    name: "Copy full context for ChatGPT",
  }).click()

  await expect(
    page.getByRole("button", { name: "Full context copied" }),
  ).toBeVisible()
  const prompt = await page.evaluate(() => navigator.clipboard.readText())
  expect(prompt).toContain('"id": "baska-voda-demo"')
  expect(prompt).toContain('"title": "Baška Voda Adventure"')
  expect(prompt).toContain('"locked": true')
  expect(prompt).toContain('"events": []')
  expect(prompt).toContain("get_mission_state")
  const release = page.getByText("v0.1.1 · updated 3 Sep 2026")
  const primary = page.getByRole("button", { name: "New plan" })
  await expect(release).toBeVisible()
  const releaseStyle = await release.evaluate((element) => {
    const style = getComputedStyle(element)
    return {
      background: style.backgroundImage,
      border: style.borderStyle,
      shadow: style.boxShadow,
    }
  })
  expect(releaseStyle).toEqual({
    background: "none",
    border: "none",
    shadow: "none",
  })
  const releaseBox = await release.boundingBox()
  const primaryBox = await primary.boundingBox()
  expect(releaseBox).not.toBeNull()
  expect(primaryBox).not.toBeNull()
  if (releaseBox !== null && primaryBox !== null)
    expect(releaseBox.x + releaseBox.width).toBeLessThan(primaryBox.x)
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(390)
  await page.screenshot({
    fullPage: true,
    path: "artifacts/sidequest-full-context-copy.png",
  })

  await page.getByRole("button", { name: "New plan" }).click()
  expect(dialogCount).toBe(0)
  await expect(page.getByRole("heading", { name: "Untitled plan" })).toBeVisible()
  await expect(page.getByText(/Drag any unlocked item to reorder it/)).toBeVisible()
})
