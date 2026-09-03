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
  storage: StoragePort
}

const withPlanningStage = (value: unknown) => {
  if (typeof value !== "object" || value === null) return value
  const mission = value as Record<string, unknown>
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
    const parsed = MissionSchema.safeParse(withPlanningStage(JSON.parse(stored)))
    if (parsed.success) return parsed.data
  } catch {
    // Invalid local data falls through to the one-key recovery below.
  }

  storage.removeItem(MISSION_STORAGE_KEY)
  return createBlankMission(now, timezone)
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
    loadDemo: (demoId = DEMO_MISSION_ID) => publish(createDemoMission(demoId)),
    newPlan: () => publish(createBlankMission()),
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
