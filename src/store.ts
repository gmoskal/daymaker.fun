import {
  MissionSchema,
  type Mission,
  type MissionAction,
  type MissionMutation,
} from "./domain/mission"
import { applyMissionAction } from "./domain/mission-transition"
import {
  DEMO_MISSION_ID,
  createBlankMission,
  createDemoMission,
  type DemoMissionId,
} from "./domain/seed"

export const MISSION_STORAGE_KEY = "sidequest:mission:v1"

export type StoragePort = Pick<Storage, "getItem" | "removeItem" | "setItem">

export type MissionStore = {
  dispatch: (action: MissionAction) => MissionMutation
  getSnapshot: () => Mission
  loadDemo: (id?: DemoMissionId) => void
  newPlan: () => void
  subscribe: (listener: () => void) => () => void
}

type CreateMissionStoreParams = {
  id: () => string
  mission: Mission
  now?: () => Date
  storage: StoragePort
}

type WithMissionDefaultsParams = {
  observedAt: Date
  value: unknown
}

const withMissionDefaults = ({ observedAt, value }: WithMissionDefaultsParams) => {
  if (typeof value !== "object" || value === null) return value
  const mission = value as Record<string, unknown>
  if (mission.updatedAt === undefined)
    mission.updatedAt = observedAt.toISOString()
  const context = mission.context
  if (typeof context !== "object" || context === null) return value
  const storedContext = context as Record<string, unknown>
  if (storedContext.stage !== undefined) return value
  const hasNeeds =
    Array.isArray(storedContext.constraints) && storedContext.constraints.length > 0
  const hasSchedule = Array.isArray(mission.stops) && mission.stops.length > 0
  storedContext.stage = hasNeeds || hasSchedule ? "needs" : "brief"
  return value
}

export const loadMission = (
  storage: StoragePort,
  now = new Date(),
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
): Mission => {
  const stored = storage.getItem(MISSION_STORAGE_KEY)
  if (stored === null) return createBlankMission(now, timezone)

  try {
    const parsed = MissionSchema.safeParse(
      withMissionDefaults({ observedAt: now, value: JSON.parse(stored) }),
    )
    if (parsed.success) {
      const normalized = JSON.stringify(parsed.data)
      if (normalized !== stored) storage.setItem(MISSION_STORAGE_KEY, normalized)
      return parsed.data
    }
  } catch {
    // Invalid local data falls through to the one-key recovery below.
  }

  storage.removeItem(MISSION_STORAGE_KEY)
  return createBlankMission(now, timezone)
}

export const createMissionStore = ({
  id,
  mission,
  now = () => new Date(),
  storage,
}: CreateMissionStoreParams): MissionStore => {
  let snapshot = structuredClone(mission)
  const listeners = new Set<() => void>()

  const publish = ({
    mission: next,
    publishedAt = now(),
  }: {
    mission: Mission
    publishedAt?: Date
  }) => {
    snapshot = { ...next, updatedAt: publishedAt.toISOString() }
    storage.setItem(MISSION_STORAGE_KEY, JSON.stringify(snapshot))
    listeners.forEach((listener) => listener())
    return snapshot
  }

  return {
    dispatch: (action) => {
      const mutation = applyMissionAction({ action, id, mission: snapshot })
      if (mutation.type === "rejected") return mutation
      return {
        type: "applied",
        value: {
          ...mutation.value,
          mission: publish({ mission: mutation.value.mission }),
        },
      }
    },
    getSnapshot: () => snapshot,
    loadDemo: (demoId = DEMO_MISSION_ID) =>
      publish({ mission: createDemoMission(demoId) }),
    newPlan: () => {
      const publishedAt = now()
      publish({ mission: createBlankMission(publishedAt), publishedAt })
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
