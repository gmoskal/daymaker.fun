import { expect, test, type Page } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-09-03T13:44:00.000Z"))
})

type ToolOutcome = {
  changed?: { stopId?: string }
  ok: boolean
  revision: number
  sessionUrl?: string
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
      label: "Baška Voda",
      lat: 43.3565,
      lng: 16.9494,
    },
    currentTime: "2026-09-04T06:30:00+02:00",
    energy: "high",
    expectedRevision: 0,
    reason: "Structured the person's free-form Needs before generating.",
    replacePlan: true,
    timezone: "Europe/Zagreb",
    title: "Gravel Before Brunch",
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
  return swim
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
  expect(
    await page.evaluate(() => getComputedStyle(document.documentElement).fontSize),
  ).toBe("18px")
  await expect(page.getByRole("tab", { name: "Proposed schedule" }))
    .toHaveAttribute("aria-disabled", "true")
  await selectExample(page, /Palermo arrival/)

  const brief = page.getByRole("textbox", {
    name: "1 · Describe your needs",
  })
  await expect(brief).toContainText("Palermo Airport")
  const editedBrief = `${await brief.inputValue()} Keep the 16:00 Hotel Trinacria arrival fixed.`
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
  const researchDepth = page.getByRole("slider", { name: "Research depth" })
  await expect(researchDepth).toHaveAttribute("aria-valuetext", "Normal")
  await researchDepth.fill("0")
  await expect(researchDepth).toHaveAttribute("aria-valuetext", "Quick")
  expect(
    await page.evaluate(() =>
      localStorage.getItem("daymaker:research-depth:v1"),
    ),
  ).toBe("quick")
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
  expect(
    await page.evaluate(() => getComputedStyle(document.documentElement).fontSize),
  ).toBe("16px")
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
    "https://daymaker.fun/needs?new=1",
  )
  expect(initialCopied).toContain("continue in Work")
  expect(initialCopied).toContain(
    "planning URL clears the previous browser-local board",
  )
  expect(initialCopied).toContain("Keep the 16:00 Hotel Trinacria arrival fixed")
  expect(initialCopied).toContain('"sampleData": true')
  expect(initialCopied).toContain("RESEARCH DEPTH: QUICK")
  expect(initialCopied).not.toContain('"needs"')
  await researchDepth.fill("1")

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
      { fixed: true, label: "Hotel Trinacria arrival at 16:00" },
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
  const needsShare = page.getByRole("button", { name: "Copy link to share" })
  await expect(needsShare).toBeVisible()
  expect(
    await needsShare.evaluate((element) => {
      const panel = document.querySelector(".panel--context")
      return panel === null
        ? null
        : Math.abs(
            element.getBoundingClientRect().left -
              panel.getBoundingClientRect().left,
          )
    }),
  ).toBeLessThan(1)
  await needsShare.click()
  await expect(page.getByRole("button", { name: "Link copied" })).toBeVisible()
  expect(
    await page.evaluate(
      () => (window as typeof window & { __copiedText: string }).__copiedText,
    ),
  ).toContain("/needs#session=")
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
  const newNeed = page.getByRole("textbox", { name: "New need" })
  await expect(newNeed.locator("xpath=ancestor::*[contains(@class, 'need-add-row')]"))
    .toBeVisible()
  await newNeed.fill("quiet lunch")
  await newNeed.press("Enter")
  await page
    .getByRole("button", { name: "Make quiet lunch non-negotiable" })
    .click()
  await page.getByRole("button", { name: "Remove practical parking at every stop" }).click()
  await page.screenshot({ fullPage: true, path: "artifacts/sidequest-needs.png" })
  await copyChanges.click()

  const copied = await page.evaluate(
    () => (window as typeof window & { __copiedText: string }).__copiedText,
  )
  expect(copied).toContain("Start tomorrow's route at Palermo Airport")
  expect(copied).toContain('"label": "quiet lunch"')
  expect(copied).toContain('"fixed": true')
  expect(copied).toContain("replacePlan: true")
  expect(copied).not.toContain("one worthwhile sight nearby")
  await page.setViewportSize({ height: 844, width: 390 })
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(390)
  await page.getByRole("button", { name: "Add need" }).click()
  const mobileNewNeed = page.getByRole("textbox", { name: "New need" })
  const addAlignment = await mobileNewNeed.evaluate((input) => {
    const addRow = input.closest(".need-add-row")
    const add = addRow?.querySelector(".add-trigger")
    const need = document.querySelector(".constraint-list .inline-editor")
    const check = document.querySelector(".constraint-list .check-control")
    if (add === undefined || add === null || need === null || check === null)
      return null
    const addBox = add.getBoundingClientRect()
    const checkBox = check.getBoundingClientRect()
    return {
      contentDelta: Math.abs(
        input.getBoundingClientRect().left - need.getBoundingClientRect().left,
      ),
      controlDelta: Math.abs(addBox.left - checkBox.left),
    }
  })
  expect(addAlignment).not.toBeNull()
  expect(addAlignment?.contentDelta).toBeLessThan(1)
  expect(addAlignment?.controlDelta).toBeLessThan(1)
  await page.screenshot({
    fullPage: true,
    path: "artifacts/sidequest-needs-add-mobile.png",
  })
  await mobileNewNeed.press("Escape")
})

test("remembers the research depth on this device", async ({ page }) => {
  await page.goto("/")
  const researchDepth = page.getByRole("slider", { name: "Research depth" })
  await expect(researchDepth).toHaveAttribute("aria-valuetext", "Normal")
  await researchDepth.fill("2")
  await expect(researchDepth).toHaveAttribute("aria-valuetext", "Deep")

  await page.reload()

  await expect(page.getByRole("slider", { name: "Research depth" }))
    .toHaveAttribute("aria-valuetext", "Deep")
})

test("agent generates a proposal with item and whole-schedule maps", async ({ page }) => {
  await installWebMcpHarness(page)
  await page.setViewportSize({ height: 900, width: 1100 })
  await page.goto("/")
  await waitForTools(page)
  await generateCroatiaProposal(page)

  await page.getByRole("tab", { name: "Proposed schedule" }).click()
  await expect(page).toHaveURL(/\/schedule$/)
  await expect(page.getByText("Iteration 1")).toBeVisible()
  const copyLink = page.getByRole("button", { name: "Copy link to share" })
  await expect(copyLink).toBeVisible()
  await copyLink.click()
  await expect(page.getByRole("button", { name: "Link copied" })).toBeVisible()
  expect(
    await page.evaluate(
      () => (window as typeof window & { __copiedText: string }).__copiedText,
    ),
  ).toContain("/schedule#session=")
  await expect(page.locator("footer button")).toHaveCount(0)
  const day = page.getByRole("region", { name: "Friday, 04 September 2026" })
  await expect(day.getByText("Baška Voda")).toBeVisible()
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
  const title = titleButton.locator(".stop-title")
  const before = await title.evaluate(
    (element) => getComputedStyle(element).fontSize,
  )
  await titleButton.click()
  await expect(titleButton).toHaveAttribute("aria-expanded", "true")
  await page.waitForTimeout(250)
  expect(await title.evaluate((element) => getComputedStyle(element).fontSize)).toBe(before)
  await expect(page.getByRole("button", {
    name: "20 km shaded gravel loop",
    exact: true,
  })).toHaveAttribute("aria-expanded", "true")
  await expect(page.getByRole("textbox", {
    name: "Edit item title: Lunch · Konoba Panorama",
  })).toHaveCount(0)

  const detailsDoNotOverlapNextItem = await titleButton.evaluate((button) => {
    const openItem = button.closest("li")
    if (openItem === null) return false
    const nextItem = openItem.nextElementSibling
    return nextItem === null
      ? true
      : openItem.getBoundingClientRect().bottom <=
          nextItem.getBoundingClientRect().top
  })
  expect(detailsDoNotOverlapNextItem).toBe(true)
  expect(
    await titleButton.locator("time").evaluate(
      (element) => getComputedStyle(element).color,
    ),
  ).toBe("rgb(168, 168, 172)")
  await expect(titleButton.locator("xpath=following-sibling::*[contains(@class, 'stop-detail-motion')]"))
    .toBeVisible()
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

test("keeps the generated proposal read-only", async ({ page }) => {
  await installWebMcpHarness(page)
  await page.setViewportSize({ height: 900, width: 1100 })
  await page.goto("/")
  await waitForTools(page)
  await generateCroatiaProposal(page)
  await page.getByRole("tab", { name: "Proposed schedule" }).click()

  const rows = page.locator('[data-testid^="stop-"]')
  await expect(rows).toHaveCount(3)
  expect(await rows.evaluateAll((items) => items.every(
    (item) => !item.hasAttribute("data-draggable"),
  ))).toBe(true)
  await expect(page.getByRole("button", { name: "Add item" })).toHaveCount(0)
  await expect(page.getByRole("button", { name: "Show item actions" })).toHaveCount(0)
  await expect(page.getByRole("textbox", { name: /Edit item title/ })).toHaveCount(0)

  const first = page.getByRole("button", {
    name: "20 km shaded gravel loop",
    exact: true,
  })
  const second = page.getByRole("button", {
    name: "Lunch · Konoba Panorama",
    exact: true,
  })
  await first.locator("time").click()
  await second.locator(".stop-location").click()
  await expect(first).toHaveAttribute("aria-expanded", "true")
  await expect(second).toHaveAttribute("aria-expanded", "true")
})

test("transfers the complete proposal to an empty browser through its session link", async ({
  browser,
  page,
}) => {
  await installWebMcpHarness(page)
  await page.goto("/")
  await waitForTools(page)
  const generated = await generateCroatiaProposal(page)
  expect(generated.sessionUrl).toContain("/schedule#session=")

  const receivingContext = await browser.newContext({
    viewport: { height: 844, width: 390 },
  })
  const receivingPage = await receivingContext.newPage()
  await receivingPage.goto(generated.sessionUrl ?? "")

  await expect(receivingPage).toHaveURL(/\/schedule$/)
  expect(receivingPage.url()).not.toContain("#session=")
  await expect(
    receivingPage.getByRole("heading", { name: "Gravel Before Brunch" }),
  ).toBeVisible()
  await expect(receivingPage.locator('[data-testid^="stop-"]')).toHaveCount(3)
  const stored = await receivingPage.evaluate(() =>
    JSON.parse(localStorage.getItem("sidequest:mission:v1") ?? "null"),
  )
  expect(stored).toMatchObject({
    revision: 4,
    stops: [
      { title: "20 km shaded gravel loop" },
      { title: "Lunch · Konoba Panorama" },
      { title: "Snorkel · Punta Rata Beach" },
    ],
  })

  await receivingPage.setViewportSize({ height: 900, width: 1100 })
  await receivingPage.reload()
  await expect(receivingPage).toHaveURL(/\/schedule$/)
  await expect(
    receivingPage.getByRole("heading", { name: "Gravel Before Brunch" }),
  ).toBeVisible()
  await receivingContext.close()
})
