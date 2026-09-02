import {
  AddMissionStopInputSchema,
  ReorderMissionStopsInputSchema,
  UpdateDayContextInputSchema,
  UpdateMissionStopInputSchema,
  type Actor,
  type Mission,
  type MissionAction,
  type MissionChange,
  type MissionError,
  type MissionMutation,
  type MissionStop,
} from "./mission"

type ApplyMissionActionParams = {
  action: MissionAction
  id: () => string
  mission: Mission
}

type ApplyParams<TAction extends MissionAction> = {
  action: TAction
  id: () => string
  mission: Mission
}

type MissionPatch = Pick<Mission, "context" | "stops">

type CommitParams = {
  actor: Actor
  at: string
  change: MissionChange
  id: () => string
  mission: Mission
  patch: Partial<MissionPatch>
}

const rejected = (
  mission: Mission,
  code: MissionError["code"],
  message: string,
  retryable = false,
): MissionMutation => ({
  type: "rejected",
  value: { code, message, retryable, revision: mission.revision },
})

const concise = (value: string) => value.slice(0, 180)

const commit = ({
  actor,
  at,
  change,
  id,
  mission,
  patch,
}: CommitParams): MissionMutation => ({
  type: "applied",
  value: {
    change,
    mission: {
      ...mission,
      ...patch,
      events: [
        {
          actor,
          at,
          id: `event-${id()}`,
          summary: concise(change.summary),
          type: change.type,
        },
        ...mission.events,
      ].slice(0, 20),
      revision: mission.revision + 1,
    },
  },
})

const stale = (mission: Mission, expectedRevision: number) =>
  expectedRevision === mission.revision
    ? null
    : rejected(
        mission,
        "STALE_REVISION",
        `Mission changed. Read it again and retry with revision ${mission.revision}.`,
        true,
      )

const applyContext = ({
  action,
  id,
  mission,
}: ApplyParams<Extract<MissionAction, { type: "UpdateContext" }>>): MissionMutation => {
  const parsed = UpdateDayContextInputSchema.safeParse(action.value.input)
  if (!parsed.success)
    return rejected(mission, "INVALID_INPUT", "The day context is invalid.")

  const conflict = stale(mission, parsed.data.expectedRevision)
  if (conflict !== null) return conflict

  const { expectedRevision: _expectedRevision, reason, ...context } = parsed.data
  return commit({
    actor: action.value.actor,
    at: context.currentTime,
    change: {
      summary: `Updated context — ${reason}`,
      type: "context_updated",
    },
    id,
    mission,
    patch: { context },
  })
}

const applyStop = ({
  action,
  id,
  mission,
}: ApplyParams<Extract<MissionAction, { type: "UpdateStop" }>>): MissionMutation => {
  const parsed = UpdateMissionStopInputSchema.safeParse(action.value.input)
  if (!parsed.success)
    return rejected(mission, "INVALID_INPUT", "The stop update is invalid.")

  const conflict = stale(mission, parsed.data.expectedRevision)
  if (conflict !== null) return conflict

  const stop = mission.stops.find((item) => item.id === parsed.data.stopId)
  if (stop === undefined)
    return rejected(mission, "STOP_NOT_FOUND", "That stop is not in this mission.")
  if (stop.locked)
    return rejected(
      mission,
      "LOCKED_STOP",
      `${stop.title} is a locked commitment and cannot change status.`,
    )

  const stops = mission.stops.map((item) =>
    item.id === stop.id
      ? {
          ...item,
          ...(parsed.data.note === undefined ? {} : { note: parsed.data.note }),
          status: parsed.data.status,
        }
      : item,
  )
  return commit({
    actor: action.value.actor,
    at: mission.context.currentTime,
    change: {
      stopId: stop.id,
      summary: `${stop.title} marked ${parsed.data.status}`,
      type: "stop_updated",
    },
    id,
    mission,
    patch: { stops },
  })
}

const slug = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

const stopId = (mission: Mission, title: string, suffix: string) => {
  const base = `${slug(title)}-${slug(suffix)}`
  let candidate = base
  let sequence = 2
  while (mission.stops.some((stop) => stop.id === candidate)) {
    candidate = `${base}-${sequence}`
    sequence += 1
  }
  return candidate
}

const applyAdd = ({
  action,
  id,
  mission,
}: ApplyParams<Extract<MissionAction, { type: "AddStop" }>>): MissionMutation => {
  const parsed = AddMissionStopInputSchema.safeParse(action.value.input)
  if (!parsed.success)
    return rejected(mission, "INVALID_INPUT", "The new stop is invalid.")

  const conflict = stale(mission, parsed.data.expectedRevision)
  if (conflict !== null) return conflict
  if (mission.stops.length >= 8)
    return rejected(mission, "LIMIT_REACHED", "A mission can contain at most 8 stops.")

  const { expectedRevision: _expectedRevision, ...input } = parsed.data
  const added: MissionStop = {
    ...input,
    id: stopId(mission, input.title, id()),
    locked: false,
    status: "planned",
  }
  return commit({
    actor: action.value.actor,
    at: mission.context.currentTime,
    change: {
      stopId: added.id,
      summary: `Added ${added.title}`,
      type: "stop_added",
    },
    id,
    mission,
    patch: { stops: [...mission.stops, added] },
  })
}

export const futureStops = (mission: Mission): MissionStop[] =>
  mission.stops.filter(
    (stop) => stop.status === "active" || stop.status === "planned",
  )

const sameIdsOnce = (actual: string[], proposed: string[]) =>
  actual.length === proposed.length &&
  new Set(proposed).size === proposed.length &&
  actual.every((stopId) => proposed.includes(stopId))

const applyReorder = ({
  action,
  id,
  mission,
}: ApplyParams<Extract<MissionAction, { type: "ReorderStops" }>>): MissionMutation => {
  const parsed = ReorderMissionStopsInputSchema.safeParse(action.value.input)
  if (!parsed.success)
    return rejected(mission, "INVALID_INPUT", "The proposed order is invalid.")

  const conflict = stale(mission, parsed.data.expectedRevision)
  if (conflict !== null) return conflict

  const future = futureStops(mission)
  const proposedIds = parsed.data.orderedStops.map((stop) => stop.stopId)
  if (!sameIdsOnce(future.map((stop) => stop.id), proposedIds))
    return rejected(
      mission,
      "INVALID_ORDER",
      "Include every active or planned stop exactly once.",
    )

  const proposedById = new Map(
    parsed.data.orderedStops.map((stop) => [stop.stopId, stop]),
  )
  const movedLock = future.find(
    (stop) =>
      stop.locked && proposedById.get(stop.id)?.startsAt !== stop.startsAt,
  )
  if (movedLock !== undefined)
    return rejected(
      mission,
      "INVALID_ORDER",
      `${movedLock.title} is locked at its original time.`,
    )

  const futureById = new Map(future.map((stop) => [stop.id, stop]))
  const ordered: MissionStop[] = []
  for (const proposal of parsed.data.orderedStops) {
    const stop = futureById.get(proposal.stopId)
    if (stop === undefined)
      return rejected(
        mission,
        "INVALID_ORDER",
        "A proposed stop is no longer in the future mission.",
        true,
      )
    ordered.push({ ...stop, startsAt: proposal.startsAt })
  }
  const history = mission.stops.filter(
    (stop) => stop.status === "completed" || stop.status === "skipped",
  )
  return commit({
    actor: action.value.actor,
    at: mission.context.currentTime,
    change: {
      summary: `Reordered future stops — ${parsed.data.reason}`,
      type: "stops_reordered",
    },
    id,
    mission,
    patch: { stops: [...history, ...ordered] },
  })
}

export const applyMissionAction = ({
  action,
  id,
  mission,
}: ApplyMissionActionParams): MissionMutation => {
  switch (action.type) {
    case "UpdateContext":
      return applyContext({ action, id, mission })
    case "UpdateStop":
      return applyStop({ action, id, mission })
    case "AddStop":
      return applyAdd({ action, id, mission })
    case "ReorderStops":
      return applyReorder({ action, id, mission })
  }
}

