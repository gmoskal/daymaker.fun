import { describe, expect, it } from "vitest"

import { SEED_MISSION } from "./domain/seed"
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

  it("loads valid data and removes only an invalid Sidequest value", () => {
    const valid = memoryStorage({
      [MISSION_STORAGE_KEY]: JSON.stringify({ ...SEED_MISSION, revision: 9 }),
      unrelated: "preserve me",
    })
    const invalid = memoryStorage({
      [MISSION_STORAGE_KEY]: "not-json",
      unrelated: "preserve me",
    })

    expect(loadMission(valid.storage).revision).toBe(9)
    expect(loadMission(invalid.storage)).toEqual(SEED_MISSION)
    expect(invalid.removals).toEqual([MISSION_STORAGE_KEY])
    expect(invalid.values.get("unrelated")).toBe("preserve me")
  })

  it("reset restores a fresh deterministic seed", () => {
    const memory = memoryStorage()
    const store = createMissionStore({
      id: () => "store-id",
      mission: { ...SEED_MISSION, revision: 12 },
      storage: memory.storage,
    })

    store.reset()

    expect(store.getSnapshot()).toEqual(SEED_MISSION)
    expect(store.getSnapshot()).not.toBe(SEED_MISSION)
    expect(memory.writes).toEqual([MISSION_STORAGE_KEY])
  })
})
