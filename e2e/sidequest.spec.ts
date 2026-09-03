import { expect, test, type Locator, type Page } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-09-03T13:44:00.000Z"))
})

type ToolOutcome = {
  changed?: { stopId?: string }
  ok: boolean
  revision: number
}

const installWebMcpHarness = async (page: Page) => {
  await page.addInitScript(() => {
    localStorage.clear()
    const registered = new Map<string, { execute: (input: unknown) => unknown }>()
    Object.assign(window, { __copiedText: "", __sidequestTools: registered })
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: (value: string) => {
          Object.assign(window, { __copiedText: value })
          return Promise.resolve()
        },
      },
    })
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

const selectExample = async (page: Page, name: RegExp) => {
  await page.getByRole("button", { name: "Load demo" }).click()
  await page.getByRole("menuitem", { name }).click()
}

const waitForTools = async (page: Page) => {
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
}

const addStop = async (
  page: Page,
  revision: number,
  input: Record<string, unknown>,
) =>
  executeTool(page, "add_mission_stop", {
    durationMinutes: 45,
    expectedRevision: revision,
    kind: "activity",
    rationale: "Fits the current Needs and verified timing.",
    source: {
      checkedAt: "2026-09-04T06:35:00+02:00",
      title: "Croatia tourism",
      url: "https://croatia.hr/en-gb",
    },
    travelMinutesFromPrevious: 15,
    ...input,
  })

const generateCroatiaProposal = async (page: Page) => {
  await selectExample(page, /South Croatia gravel day/)
  const brief = await page
    .getByRole("textbox", { name: "1 · Describe your needs" })
    .inputValue()
  const context = await executeTool(page, "update_day_context", {
    brief,
    needs: [
      { fixed: false, label: "20 km gravel ride" },
      { fixed: true, label: "finish before 10:00" },
      { fixed: false, label: "maximum one hour by car" },
      { fixed: false, label: "shaded route with some asphalt" },
      { fixed: true, label: "avoid main roads" },
      { fixed: false, label: "excellent restaurant on the return" },
      { fixed: false, label: "snorkeling beach with an interesting seabed" },
      { fixed: true, label: "designated parking at every stop" },
      { fixed: false, label: "calculate the return time" },
    ],
    currentLocation: {
      label: "Grand Hotel Slavia, Baška Voda",
      lat: 43.3565,
      lng: 16.9494,
    },
    currentTime: "2026-09-04T06:30:00+02:00",
    energy: "high",
    expectedRevision: 0,
    reason: "Structured the person's free-form Needs before generating.",
    replacePlan: true,
    timezone: "Europe/Zagreb",
    title: "South Croatia gravel day",
  })
  expect(context).toMatchObject({ ok: true, revision: 1 })

  const ride = await addStop(page, 1, {
    durationMinutes: 120,
    location: {
      label: "Biokovo gravel route parking",
      lat: 43.3266,
      lng: 17.0098,
    },
    rationale: "A shaded 20 km mixed-surface loop that finishes before 10:00.",
    startsAt: "2026-09-04T07:15:00+02:00",
    title: "20 km shaded gravel loop",
  })
  const lunch = await addStop(page, ride.revision, {
    durationMinutes: 75,
    kind: "meal",
    location: {
      label: "Konoba Panorama parking, Baška Voda",
      lat: 43.3501,
      lng: 16.9582,
    },
    rationale: "A well-timed local lunch with practical parking on the return.",
    startsAt: "2026-09-04T10:30:00+02:00",
    title: "Lunch · Konoba Panorama",
  })
  const swim = await addStop(page, lunch.revision, {
    durationMinutes: 90,
    location: {
      label: "Punta Rata Beach parking, Brela",
      lat: 43.3692,
      lng: 16.9221,
    },
    rationale: "Clear water and a varied seabed make this a practical snorkeling stop.",
    startsAt: "2026-09-04T12:30:00+02:00",
    title: "Snorkel · Punta Rata Beach",
  })
  expect(swim).toMatchObject({ ok: true, revision: 4 })
}

const dragTo = async (page: Page, handle: Locator, target: Locator) => {
  const sourceBox = await handle.boundingBox()
  const targetBox = await target.boundingBox()
  if (sourceBox === null || targetBox === null)
    throw new Error("Drag targets must be visible")

  await page.mouse.move(sourceBox.x + 8, sourceBox.y + sourceBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(targetBox.x + 8, targetBox.y + 8, { steps: 18 })
  await page.mouse.up()
}

test("shows only the two free-form Needs examples without overflow", async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 })
  await page.goto("/")
  await page.getByRole("button", { name: "Load demo" }).click()

  await expect(page.getByRole("menuitem")).toHaveCount(2)
  await expect(page.getByRole("menuitem", { name: /Palermo arrival/ })).toBeVisible()
  await expect(
    page.getByRole("menuitem", { name: /South Croatia gravel day/ }),
  ).toBeVisible()
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(390)
  await page.screenshot({ fullPage: true, path: "artifacts/sidequest-demo-menu.png" })
})

test("edits Needs and copies the current handoff", async ({ page }) => {
  await installWebMcpHarness(page)
  await page.setViewportSize({ height: 900, width: 1100 })
  await page.goto("/")
  await waitForTools(page)
  await expect(page.getByRole("tab", { name: "Proposed schedule" }))
    .toHaveAttribute("aria-disabled", "true")
  await selectExample(page, /Palermo arrival/)

  const brief = page.getByRole("textbox", {
    name: "1 · Describe your needs",
  })
  await expect(brief).toContainText("Palermo Airport")
  const editedBrief = `${await brief.inputValue()} Keep the 16:00 hotel check-in fixed.`
  await brief.fill(editedBrief)
  expect(
    await brief.evaluate((element) => element.scrollHeight > element.clientHeight),
  ).toBe(true)
  expect(
    await brief.evaluate((element) => getComputedStyle(element).scrollbarColor),
  ).toContain("rgb(210, 31, 43)")
  const scrollThumb = page.locator(".needs-scrollbar > span")
  await expect(scrollThumb).toBeVisible()
  const thumbAtTop = await scrollThumb.evaluate(
    (element) => getComputedStyle(element).transform,
  )
  await brief.evaluate((element) => {
    element.scrollTop = element.scrollHeight
    element.dispatchEvent(new Event("scroll"))
  })
  await expect
    .poll(() =>
      scrollThumb.evaluate((element) => getComputedStyle(element).transform),
    )
    .not.toBe(thumbAtTop)
  await brief.evaluate((element) => {
    element.scrollTop = 0
    element.dispatchEvent(new Event("scroll"))
  })
  await expect(
    page.getByRole("textbox", {
      name: "Edit need: rent a car at Palermo Airport",
    }),
  ).toHaveCount(0)

  const initialCopyButton = page.getByRole("button", {
    name: "Copy to ChatGPT",
  })
  const initialCopyButtonStyle = await initialCopyButton.evaluate((element) => {
    const style = getComputedStyle(element)
    return {
      backgroundColor: style.backgroundColor,
      height: element.getBoundingClientRect().height,
    }
  })
  expect(initialCopyButtonStyle.backgroundColor).toBe("rgb(210, 31, 43)")
  expect(initialCopyButtonStyle.height).toBeGreaterThanOrEqual(44)
  await page.screenshot({ fullPage: true, path: "artifacts/sidequest-brief.png" })
  await page.setViewportSize({ height: 844, width: 390 })
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(390)
  await page.screenshot({
    fullPage: true,
    path: "artifacts/sidequest-brief-mobile.png",
  })
  await page.setViewportSize({ height: 900, width: 1100 })
  await initialCopyButton.click()
  const initialCopied = await page.evaluate(
    () => (window as typeof window & { __copiedText: string }).__copiedText,
  )
  expect(initialCopied).toContain(
    "https://sidequest-webmcp-eta.vercel.app/needs",
  )
  expect(initialCopied).toContain("continue in Work")
  expect(initialCopied).toContain("If the live board is blank")
  expect(initialCopied).toContain("Keep the 16:00 hotel check-in fixed")
  expect(initialCopied).not.toContain('"needs"')

  const extracted = await executeTool(page, "update_day_context", {
    brief: editedBrief,
    currentLocation: { label: "Palermo Airport", lat: 38.1759, lng: 13.091 },
    currentTime: "2026-09-04T08:00:00+02:00",
    energy: "medium",
    expectedRevision: 1,
    needs: [
      { fixed: false, label: "rent a car at Palermo Airport" },
      { fixed: false, label: "excellent breakfast and coffee first" },
      { fixed: false, label: "one worthwhile sight nearby" },
      { fixed: true, label: "Hotel Trinacria check-in at 16:00" },
      { fixed: false, label: "practical parking at every stop" },
    ],
    reason: "Extracted the person's free-form brief into editable Needs.",
    replacePlan: true,
    timezone: "Europe/Rome",
    title: "Palermo arrival",
  })
  expect(extracted).toMatchObject({ ok: true, revision: 2 })
  await expect(page.getByRole("tab", { name: "Proposed schedule" }))
    .toHaveAttribute("aria-disabled", "false")
  await expect(brief).toHaveCount(0)
  await expect(
    page.getByRole("textbox", {
      name: "Edit need: rent a car at Palermo Airport",
    }),
  ).toBeVisible()
  const copyChanges = page.getByRole("button", {
    name: "Copy changes to ChatGPT",
  })
  await expect(copyChanges).toBeDisabled()
  await page.getByRole("button", { name: "Cross out one worthwhile sight nearby" }).click()
  await expect(copyChanges).toBeEnabled()
  await page.getByRole("button", { name: "Add need" }).click()
  await page.getByRole("textbox", { name: "New need" }).fill("quiet lunch")
  await page.getByRole("textbox", { name: "New need" }).press("Enter")
  await page.getByRole("button", { name: "Mark quiet lunch as fixed" }).click()
  await page.getByRole("button", { name: "Remove practical parking at every stop" }).click()
  await page.screenshot({ fullPage: true, path: "artifacts/sidequest-needs.png" })
  await copyChanges.click()

  const copied = await page.evaluate(
    () => (window as typeof window & { __copiedText: string }).__copiedText,
  )
  expect(copied).toContain("I land at Palermo Airport tomorrow morning")
  expect(copied).toContain('"label": "quiet lunch"')
  expect(copied).toContain('"fixed": true')
  expect(copied).toContain("replacePlan: true")
  expect(copied).not.toContain("one worthwhile sight nearby")
  await page.setViewportSize({ height: 844, width: 390 })
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(390)
  await page.screenshot({
    fullPage: true,
    path: "artifacts/sidequest-needs-mobile.png",
  })
})

test("agent generates a proposal with item and whole-schedule maps", async ({ page }) => {
  await installWebMcpHarness(page)
  await page.setViewportSize({ height: 900, width: 1100 })
  await page.goto("/")
  await waitForTools(page)
  await generateCroatiaProposal(page)

  await page.getByRole("tab", { name: "Proposed schedule" }).click()
  await expect(page).toHaveURL(/\/schedule$/)
  const day = page.getByRole("region", { name: "Friday, 04 September 2026" })
  await expect(day.getByText("Grand Hotel Slavia, Baška Voda")).toBeVisible()
  await expect(day.getByText("06:30")).toHaveCount(0)
  await expect(page.getByRole("button", { name: "20 km shaded gravel loop", exact: true }))
    .toBeVisible()
  await page.getByRole("button", { name: "20 km shaded gravel loop", exact: true }).click()
  await expect(
    page.getByRole("link", {
      name: "Open in Google Maps: 20 km shaded gravel loop",
    }),
  ).toBeVisible()
  await expect(
    page.getByRole("link", {
      name: "Open in Apple Maps: 20 km shaded gravel loop",
    }),
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: "Open proposed schedule in Google Maps" }),
  ).toBeVisible()

  const titleButton = page.getByRole("button", {
    name: "Lunch · Konoba Panorama",
    exact: true,
  })
  const before = await titleButton.evaluate(
    (element) => getComputedStyle(element).fontSize,
  )
  await titleButton.click()
  const editor = page.getByRole("textbox", {
    name: "Edit item title: Lunch · Konoba Panorama",
  })
  await expect(editor).toBeVisible()
  expect(await editor.evaluate((element) => getComputedStyle(element).fontSize)).toBe(before)

  const detailsDoNotOverlapNextItem = await editor.evaluate((titleEditor) => {
    const openItem = titleEditor.closest("li")
    if (openItem === null) return false
    const nextItem = openItem.nextElementSibling
    return nextItem === null
      ? true
      : openItem.getBoundingClientRect().bottom <=
          nextItem.getBoundingClientRect().top
  })
  expect(detailsDoNotOverlapNextItem).toBe(true)
  expect(
    await page
      .getByRole("button", {
        name: "Snorkel · Punta Rata Beach",
        exact: true,
      })
      .evaluate((element) => element.scrollWidth <= element.clientWidth),
  ).toBe(true)

  const tabsOverlap = await page.locator(".side-tabs a").evaluateAll((tabs) => {
    const boxes = tabs.map((tab) => tab.getBoundingClientRect())
    return boxes.slice(1).some((box, index) => box.top < boxes[index]!.bottom)
  })
  expect(tabsOverlap).toBe(false)
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(1100)
  await page.screenshot({
    fullPage: true,
    path: "artifacts/sidequest-needs-schedule.png",
  })

  await page.setViewportSize({ height: 844, width: 390 })
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(390)
  const mobileControlsOverlap = await page.evaluate(() => {
    const mapLink = document.querySelector<HTMLElement>(".schedule-map-link")
    const loadDemo = document.querySelector<HTMLElement>(".primary-control")
    if (mapLink === null || loadDemo === null) return true
    const mapBox = mapLink.getBoundingClientRect()
    const demoBox = loadDemo.getBoundingClientRect()
    return !(
      mapBox.right <= demoBox.left ||
      mapBox.left >= demoBox.right ||
      mapBox.bottom <= demoBox.top ||
      mapBox.top >= demoBox.bottom
    )
  })
  expect(mobileControlsOverlap).toBe(false)
  await page.screenshot({
    fullPage: true,
    path: "artifacts/sidequest-needs-schedule-mobile.png",
  })
})

test("reorders the generated proposal from the whole unlocked item", async ({ page }) => {
  await installWebMcpHarness(page)
  await page.setViewportSize({ height: 900, width: 1100 })
  await page.goto("/")
  await waitForTools(page)
  await generateCroatiaProposal(page)
  await page.getByRole("tab", { name: "Proposed schedule" }).click()

  const swim = page.getByRole("button", {
    name: "Snorkel · Punta Rata Beach",
    exact: true,
  })
  expect(await swim.evaluate((element) => getComputedStyle(element).cursor)).toBe("grab")
  await dragTo(
    page,
    swim,
    page.getByRole("button", { name: "Lunch · Konoba Panorama", exact: true }),
  )

  await expect
    .poll(() =>
      page
        .locator('[data-testid^="stop-"]')
        .evaluateAll((stops) =>
          stops.map((stop) => {
            const editor = stop.querySelector<HTMLInputElement>(".inline-editor")
            return editor?.value ?? stop.querySelector(".stop-title-button")?.textContent
          }),
        ),
    )
    .toEqual([
      expect.stringContaining("20 km shaded gravel loop"),
      expect.stringContaining("Snorkel · Punta Rata Beach"),
      expect.stringContaining("Lunch · Konoba Panorama"),
    ])
})
