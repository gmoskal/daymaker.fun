import {
  MissionSchema,
  type Mission,
  type MissionAction,
  type MissionMutation,
} from "./domain/mission"
import { applyMissionAction } from "./domain/mission-transition"
import { SEED_MISSION } from "./domain/seed"

export const MISSION_STORAGE_KEY = "sidequest:mission:v1"

export type StoragePort = Pick<Storage, "getItem" | "removeItem" | "setItem">

export type MissionStore = {
  dispatch: (action: MissionAction) => MissionMutation
  getSnapshot: () => Mission
  reset: () => void
  subscribe: (listener: () => void) => () => void
}

type CreateMissionStoreParams = {
  id: () => string
  mission: Mission
  storage: StoragePort
}

const seed = (): Mission => structuredClone(SEED_MISSION)

export const loadMission = (storage: StoragePort): Mission => {
  const stored = storage.getItem(MISSION_STORAGE_KEY)
  if (stored === null) return seed()

  try {
    const parsed = MissionSchema.safeParse(JSON.parse(stored))
    if (parsed.success) return parsed.data
  } catch {
    // Invalid local data falls through to the one-key recovery below.
  }

  storage.removeItem(MISSION_STORAGE_KEY)
  return seed()
}

export const createMissionStore = ({
  id,
  mission,
  storage,
}: CreateMissionStoreParams): MissionStore => {
  let snapshot = structuredClone(mission)
  const listeners = new Set<() => void>()

  const publish = (next: Mission) => {
    snapshot = next
    storage.setItem(MISSION_STORAGE_KEY, JSON.stringify(snapshot))
    listeners.forEach((listener) => listener())
  }

  return {
    dispatch: (action) => {
      const mutation = applyMissionAction({ action, id, mission: snapshot })
      if (mutation.type === "applied") publish(mutation.value.mission)
      return mutation
    },
    getSnapshot: () => snapshot,
    reset: () => publish(seed()),
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
