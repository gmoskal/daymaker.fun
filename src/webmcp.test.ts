import { afterEach, describe, expect, it, vi } from "vitest"

import { SEED_MISSION } from "./domain/seed"
import { createMissionStore, type MissionStore, type StoragePort } from "./store"
import {
  TOOL_NAMES,
  registerMissionTools,
  type MissionStateResult,
  type ToolMutationResult,
} from "./webmcp"

const memoryStorage: StoragePort = {
  getItem: () => null,
  removeItem: () => undefined,
  setItem: () => undefined,
}
const ids = () => {
  let value = 0
  return () => `id-${(value += 1)}`
}
const store = (): MissionStore =>
  createMissionStore({ id: ids(), mission: SEED_MISSION, storage: memoryStorage })

type FakeContext = {
  definitions: WebMCP.ModelContextTool[]
  registerTool: ReturnType<typeof vi.fn>
}

const setModelContext = (context?: Partial<WebMCP.ModelContext>) =>
  Object.defineProperty(document, "modelContext", {
    configurable: true,
    value: context,
  })

const fakeContext = (failAt?: number): FakeContext => {
  const definitions: WebMCP.ModelContextTool[] = []
  const registerTool = vi.fn(
    async (
      definition: WebMCP.ModelContextTool,
      _options?: WebMCP.ModelContextRegisterToolOptions,
    ) => {
      definitions.push(definition)
      if (definitions.length === failAt) throw new Error("registration failed")
    },
  )
  setModelContext({ registerTool } as Partial<WebMCP.ModelContext>)
  return { definitions, registerTool }
}

const execute = async <T>(
  context: FakeContext,
  name: (typeof TOOL_NAMES)[number],
  input: Record<string, unknown>,
): Promise<T> => {
  const definition = context.definitions.find((tool) => tool.name === name)
  if (definition === undefined) throw new Error(`Missing tool ${name}`)
  return definition.execute(input, {
    signal: new AbortController().signal,
  }) as Promise<T>
}

afterEach(() => setModelContext())

describe("WebMCP", () => {
  it("exposes a bounded atomic catalog", async () => {
    const context = fakeContext()
    const registration = await registerMissionTools(store())

    expect(context.definitions.map((tool) => tool.name)).toEqual(TOOL_NAMES)
    expect(context.definitions).toHaveLength(5)
    expect(
      context.definitions.every(
        (tool) =>
          tool.name.length <= 30 &&
          tool.description.length <= 500 &&
          (tool.inputSchema as { additionalProperties?: boolean })
            .additionalProperties === false,
      ),
    ).toBe(true)
    expect(context.definitions.map((tool) => tool.annotations)).toEqual([
      { readOnlyHint: true, untrustedContentHint: true },
      undefined,
      undefined,
      undefined,
      undefined,
    ])
    expect(
      context.registerTool.mock.calls.every(
        ([, options]) => options.signal === context.registerTool.mock.calls[0]?.[1].signal,
      ),
    ).toBe(true)

    const signal = context.registerTool.mock.calls[0]?.[1].signal as AbortSignal
    expect(signal.aborted).toBe(false)
    registration.dispose()
    expect(signal.aborted).toBe(true)
  })

  it("keeps every top-level parameter description within its budget", async () => {
    const context = fakeContext()
    await registerMissionTools(store())
    const parameters = context.definitions.flatMap((tool) =>
      Object.values(
        (tool.inputSchema as { properties?: Record<string, { description?: string }> })
          .properties ?? {},
      ),
    )

    expect(
      parameters.every(
        (parameter) =>
          typeof parameter.description === "string" &&
          parameter.description.length > 0 &&
          parameter.description.length <= 150,
      ),
    ).toBe(true)
  })

  it("returns unsupported without registering or throwing", async () => {
    setModelContext()

    await expect(registerMissionTools(store())).resolves.toMatchObject({
      supported: false,
    })
  })

  it("aborts a partially registered catalog", async () => {
    const context = fakeContext(3)

    await expect(registerMissionTools(store())).rejects.toThrow("registration failed")
    expect(
      (context.registerTool.mock.calls[0]?.[1].signal as AbortSignal).aborted,
    ).toBe(true)
  })

  it("rejects invalid input without changing mission state", async () => {
    const context = fakeContext()
    const missionStore = store()
    await registerMissionTools(missionStore)
    const before = missionStore.getSnapshot()

    const result = await execute<ToolMutationResult>(context, "update_mission_stop", {
      expectedRevision: -1,
      reason: "Invalid revision.",
      status: "completed",
      stopId: "gravel-loop",
    })

    expect(result).toMatchObject({
      error: { code: "INVALID_INPUT" },
      ok: false,
      revision: 6,
    })
    expect(missionStore.getSnapshot()).toBe(before)
  })

  it("starts a titled replacement plan through update_day_context", async () => {
    const context = fakeContext()
    const missionStore = createMissionStore({
      id: ids(),
      mission: SEED_MISSION,
      storage: memoryStorage,
    })
    await registerMissionTools(missionStore)

    const initial = await execute<MissionStateResult>(
      context,
      "get_mission_state",
      {},
    )
    expect(initial).toMatchObject({
      mission: {
        context: {
          brief: expect.stringContaining("Biokovo"),
          needs: expect.arrayContaining([
            { fixed: true, label: "keep dinner at 18:30" },
          ]),
          stage: "needs",
        },
        title: "Baška Voda Adventure",
      },
      ok: true,
      revision: 6,
    })

    const contextResult = await execute<ToolMutationResult>(
      context,
      "update_day_context",
      {
        brief: "Plan a quiet Warsaw afternoon with one calm walk.",
        needs: [
          { fixed: false, label: "quiet place" },
          { fixed: true, label: "finish before 18:00" },
        ],
        currentLocation: { label: "Warsaw", lat: 52.2297, lng: 21.0122 },
        currentTime: "2026-09-03T12:15:00+02:00",
        energy: "medium",
        expectedRevision: 6,
        reason: "Starting a personal afternoon plan.",
        replacePlan: true,
        timezone: "Europe/Warsaw",
        title: "Quiet Warsaw afternoon",
      },
    )
    expect(contextResult).toMatchObject({ ok: true, revision: 7 })
    expect(missionStore.getSnapshot().context.stage).toBe("needs")
    const added = await execute<ToolMutationResult>(
      context,
      "add_mission_stop",
      {
        durationMinutes: 45,
        expectedRevision: contextResult.revision,
        kind: "activity",
        location: { label: "Saxon Garden", lat: 52.2403, lng: 21.009 },
        rationale: "A quiet central walk that fits the available time.",
        source: {
          checkedAt: "2026-09-03T12:16:00+02:00",
          title: "Warsaw tourism",
          url: "https://warsawtour.pl/",
        },
        startsAt: "2026-09-03T13:00:00+02:00",
        title: "Walk through Saxon Garden",
        travelMinutesFromPrevious: 15,
      },
    )

    expect(added).toMatchObject({ ok: true, revision: 8 })
    expect(missionStore.getSnapshot()).toMatchObject({
      id: "personal-plan",
      revision: 8,
      title: "Quiet Warsaw afternoon",
    })
    expect(missionStore.getSnapshot().stops).toHaveLength(2)
    expect(missionStore.getSnapshot().stops).toContainEqual(
      expect.objectContaining({ id: "dinner", locked: true }),
    )
    expect(missionStore.getSnapshot().events).toHaveLength(2)
  })

  it("executes the killer flow through the real store", async () => {
    const context = fakeContext()
    const missionStore = store()
    await registerMissionTools(missionStore)
    missionStore.dispatch({
      type: "UpdateStop",
      value: {
        actor: "human",
        input: {
          expectedRevision: 6,
          reason: "The gravel ride is complete.",
          status: "completed",
          stopId: "gravel-loop",
        },
      },
    })

    const initial = await execute<MissionStateResult>(context, "get_mission_state", {})
    expect(initial).toMatchObject({ ok: true, revision: 7 })

    const contextResult = await execute<ToolMutationResult>(context, "update_day_context", {
      brief: "Replace the steep hike with a relaxed swim and fuel stop.",
      needs: [
        { fixed: false, label: "car available" },
        { fixed: false, label: "dog with us" },
        { fixed: false, label: "max 20 min drive" },
        { fixed: true, label: "keep dinner at 18:30" },
      ],
      currentLocation: {
        label: "Bike parking, Baška Voda",
        lat: 43.3569,
        lng: 16.9502,
      },
      currentTime: "2026-08-30T15:10:00+02:00",
      energy: "low",
      expectedRevision: 7,
      reason: "The group finished the ride and reported low energy.",
      replacePlan: false,
      timezone: "Europe/Zagreb",
      title: "Baška Voda Adventure",
    })
    const skipped = await execute<ToolMutationResult>(context, "update_mission_stop", {
      expectedRevision: contextResult.revision,
      note: "Skipped after the ride.",
      reason: "A lower-effort activity fits the group better.",
      status: "skipped",
      stopId: "biokovo-hike",
    })
    const beach = await execute<ToolMutationResult>(context, "add_mission_stop", {
      durationMinutes: 70,
      expectedRevision: skipped.revision,
      kind: "activity",
      location: {
        label: "Punta Rata, Brela",
        lat: 43.370062,
        lng: 16.922775,
      },
      rationale: "Low-effort water time with shade before dinner.",
      source: {
        checkedAt: "2026-08-30T15:11:00+02:00",
        title: "Punta Rata — TZ Brela",
        url: "https://brela.hr/en/beaches/the-punta-rata-beach",
      },
      startsAt: "2026-08-30T15:30:00+02:00",
      title: "Punta Rata swim & snorkel",
      travelMinutesFromPrevious: 12,
    })
    const fuel = await execute<ToolMutationResult>(context, "add_mission_stop", {
      durationMinutes: 10,
      expectedRevision: beach.revision,
      kind: "service",
      location: {
        label: "Vukovarska 135, Makarska",
        lat: 43.306819,
        lng: 17.007086,
      },
      rationale: "A published non-stop fuel station before dinner.",
      source: {
        checkedAt: "2026-08-30T15:12:00+02:00",
        title: "Makarska-Ratac — INA",
        url: "https://www.ina.hr/en/station/makarska-ratac/",
      },
      startsAt: "2026-08-30T17:05:00+02:00",
      title: "Fuel at INA Makarska-Ratac",
      travelMinutesFromPrevious: 22,
    })
    if (beach.ok === false || fuel.ok === false)
      throw new Error("Expected both new stops")

    const reordered = await execute<ToolMutationResult>(context, "reorder_mission_stops", {
      expectedRevision: fuel.revision,
      orderedStops: [
        {
          startsAt: "2026-08-30T15:30:00+02:00",
          stopId: beach.changed.stopId,
        },
        {
          startsAt: "2026-08-30T17:05:00+02:00",
          stopId: fuel.changed.stopId,
        },
        {
          startsAt: "2026-08-30T17:35:00+02:00",
          stopId: "return-shower",
        },
        {
          startsAt: "2026-08-30T18:30:00+02:00",
          stopId: "dinner",
        },
      ],
      reason: "Fit snorkeling and fuel before the locked dinner.",
    })
    const final = await execute<MissionStateResult>(context, "get_mission_state", {})

    expect(reordered).toMatchObject({ ok: true, revision: 12 })
    expect(final).toMatchObject({ ok: true, revision: 12 })
    expect(JSON.stringify(final).length).toBeLessThanOrEqual(1_800)
    expect(
      JSON.stringify([
        initial,
        contextResult,
        skipped,
        beach,
        fuel,
        reordered,
        final,
      ]).length,
    ).toBeLessThanOrEqual(4_500)
    expect(
      missionStore.getSnapshot().stops.find((stop) => stop.id === "dinner")
        ?.startsAt,
    ).toBe("2026-08-30T18:30:00+02:00")
  })
})
