import { describe, expect, it } from "vitest"

import { MissionSchema, type Mission } from "./domain/mission"
import {
  DEMO_MISSIONS,
  PALERMO_ARRIVAL_MISSION,
  SEED_MISSION,
  createBlankMission,
} from "./domain/seed"
import {
  MISSION_STORAGE_KEY,
  createMissionStore,
  loadMission,
  type StoragePort,
} from "./store"

const memoryStorage = (initial: Record<string, string> = {}) => {
  const values = new Map(Object.entries(initial))
  const writes: string[] = []
  const removals: string[] = []
  const storage: StoragePort = {
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => {
      removals.push(key)
      values.delete(key)
    },
    setItem: (key, value) => {
      writes.push(key)
      values.set(key, value)
    },
  }
  return { removals, storage, values, writes }
}

describe("mission store", () => {
  it("loads only the two Needs examples", () => {
    expect(Object.keys(DEMO_MISSIONS)).toEqual([
      "palermo-arrival-demo",
      "croatia-gravel-demo",
    ])
    Object.values(DEMO_MISSIONS).forEach((mission) =>
      expect(MissionSchema.safeParse(mission).success).toBe(true),
    )
    const memory = memoryStorage()
    const missionStore = createMissionStore({
      id: () => "event-id",
      mission: createBlankMission(new Date("2026-09-03T10:15:00Z"), "UTC"),
      storage: memory.storage,
    })

    Reflect.apply(missionStore.loadDemo, missionStore, ["palermo-arrival-demo"])
    expect(missionStore.getSnapshot().title).toBe("Palermo arrival")
    expect(missionStore.getSnapshot().context.brief).toContain("Hotel Trinacria")
    expect(missionStore.getSnapshot().stops).toEqual([])

    Reflect.apply(missionStore.loadDemo, missionStore, ["croatia-gravel-demo"])
    expect(missionStore.getSnapshot().title).toBe("South Croatia gravel day")
    expect(missionStore.getSnapshot().context.brief).toContain("20 km gravel ride")
    expect(missionStore.getSnapshot().context.constraints).toEqual([])
    expect(missionStore.getSnapshot().stops).toEqual([])
  })
  it("persists an accepted action and notifies subscribers", () => {
    const memory = memoryStorage()
    const store = createMissionStore({
      id: () => "store-id",
      mission: SEED_MISSION,
      storage: memory.storage,
    })
    let notifications = 0
    store.subscribe(() => (notifications += 1))

    const mutation = store.dispatch({
      type: "UpdateStop",
      value: {
        actor: "human",
        input: {
          expectedRevision: 6,
          reason: "Completed outside the app.",
          status: "completed",
          stopId: "gravel-loop",
        },
      },
    })

    expect(mutation.type).toBe("applied")
    expect(store.getSnapshot().revision).toBe(7)
    expect(memory.writes).toEqual([MISSION_STORAGE_KEY])
    expect(notifications).toBe(1)
  })

  it("timestamps only accepted publications with the injected clock", () => {
    const memory = memoryStorage()
    const times = [
      "2026-09-03T13:42:00.000Z",
      "2026-09-03T13:43:00.000Z",
      "2026-09-03T13:44:00.000Z",
    ]
    const now = () => new Date(times.shift() ?? "invalid")
    const params = {
      id: () => "store-id",
      mission: SEED_MISSION,
      now,
      storage: memory.storage,
    }
    const store = createMissionStore(params)

    const accepted = store.dispatch({
      type: "UpdateStop",
      value: {
        actor: "human",
        input: {
          expectedRevision: 6,
          reason: "Completed outside the app.",
          status: "completed",
          stopId: "gravel-loop",
        },
      },
    })
    const acceptedAt = store.getSnapshot().updatedAt
    const rejected = store.dispatch({
      type: "UpdateStop",
      value: {
        actor: "agent",
        input: {
          expectedRevision: 6,
          reason: "Stale request.",
          status: "skipped",
          stopId: "biokovo-hike",
        },
      },
    })

    expect(accepted.type).toBe("applied")
    expect(acceptedAt).toBe("2026-09-03T13:42:00.000Z")
    expect(rejected.type).toBe("rejected")
    expect(store.getSnapshot().updatedAt).toBe(acceptedAt)

    store.loadDemo()
    expect(store.getSnapshot().updatedAt).toBe("2026-09-03T13:43:00.000Z")
    store.newPlan()
    expect(store.getSnapshot().updatedAt).toBe("2026-09-03T13:44:00.000Z")
    expect(memory.writes).toHaveLength(3)
  })

  it("does not persist or notify for a rejected action", () => {
    const memory = memoryStorage()
    const store = createMissionStore({
      id: () => "store-id",
      mission: SEED_MISSION,
      storage: memory.storage,
    })
    const initialSnapshot = store.getSnapshot()
    let notifications = 0
    store.subscribe(() => (notifications += 1))

    store.dispatch({
      type: "UpdateStop",
      value: {
        actor: "agent",
        input: {
          expectedRevision: 5,
          reason: "Stale request.",
          status: "skipped",
          stopId: "biokovo-hike",
        },
      },
    })

    expect(store.getSnapshot()).toBe(initialSnapshot)
    expect(memory.writes).toEqual([])
    expect(notifications).toBe(0)
  })

  it("starts blank, loads valid data, and removes only an invalid value", () => {
    const empty = memoryStorage()
    const valid = memoryStorage({
      [MISSION_STORAGE_KEY]: JSON.stringify({ ...SEED_MISSION, revision: 9 }),
      unrelated: "preserve me",
    })
    const invalid = memoryStorage({
      [MISSION_STORAGE_KEY]: "not-json",
      unrelated: "preserve me",
    })

    expect(loadMission(empty.storage, new Date("2026-09-03T10:15:00Z"), "UTC"))
      .toEqual(createBlankMission(new Date("2026-09-03T10:15:00Z"), "UTC"))
    expect(loadMission(valid.storage).revision).toBe(9)
    expect(loadMission(invalid.storage, new Date("2026-09-03T10:15:00Z"), "UTC"))
      .toEqual(createBlankMission(new Date("2026-09-03T10:15:00Z"), "UTC"))
    expect(invalid.removals).toEqual([MISSION_STORAGE_KEY])
    expect(invalid.values.get("unrelated")).toBe("preserve me")
  })

  it("migrates a stored mission without a brief", () => {
    const legacy = structuredClone(SEED_MISSION) as unknown as {
      context: {
        brief?: string
        constraints: Array<{
          fixed?: boolean
        }>
      }
    }
    delete legacy.context.brief
    legacy.context.constraints.forEach((need) => delete need.fixed)
    const memory = memoryStorage({
      [MISSION_STORAGE_KEY]: JSON.stringify(legacy),
    })

    const loaded = loadMission(memory.storage)

    expect((loaded.context as Mission["context"] & { brief?: string }).brief)
      .toBe("")
    expect(loaded.context.constraints.every((need) => need.fixed === false))
      .toBe(true)
    expect(loaded.context.stage).toBe("needs")
    expect(memory.removals).toEqual([])
  })

  it("migrates a stored mission without updatedAt at load time", () => {
    const legacy = structuredClone(SEED_MISSION) as Omit<Mission, "updatedAt"> & {
      updatedAt?: string
    }
    delete legacy.updatedAt
    const memory = memoryStorage({
      [MISSION_STORAGE_KEY]: JSON.stringify(legacy),
    })

    const loaded = loadMission(
      memory.storage,
      new Date("2026-09-03T13:42:00.000Z"),
      "Europe/Warsaw",
    )
    const reloaded = loadMission(
      memory.storage,
      new Date("2026-09-03T14:10:00.000Z"),
      "Europe/Warsaw",
    )

    expect(loaded.updatedAt).toBe("2026-09-03T13:42:00.000Z")
    expect(reloaded.updatedAt).toBe(loaded.updatedAt)
    expect(memory.removals).toEqual([])
    expect(memory.writes).toEqual([MISSION_STORAGE_KEY])
  })

  it("switches explicitly between a new plan and the deterministic demo", () => {
    const memory = memoryStorage()
    const store = createMissionStore({
      id: () => "store-id",
      mission: { ...SEED_MISSION, revision: 12 },
      now: () => new Date("2026-09-03T13:23:00.000Z"),
      storage: memory.storage,
    })

    store.newPlan()

    expect(store.getSnapshot().stops).toEqual([])
    expect(store.getSnapshot().title).toBe("Untitled plan")

    store.loadDemo()

    expect(store.getSnapshot()).toEqual(PALERMO_ARRIVAL_MISSION)
    expect(store.getSnapshot()).not.toBe(PALERMO_ARRIVAL_MISSION)
    expect(memory.writes).toEqual([MISSION_STORAGE_KEY, MISSION_STORAGE_KEY])
  })
})
