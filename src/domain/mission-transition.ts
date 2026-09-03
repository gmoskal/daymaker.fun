import {
  AddBoardItemInputSchema,
  AddMissionConstraintInputSchema,
  AddMissionStopInputSchema,
  PERSONAL_MISSION_ID,
  ReorderMissionConstraintsInputSchema,
  ReorderMissionStopsInputSchema,
  RemoveMissionConstraintInputSchema,
  RemoveMissionStopInputSchema,
  RenameMissionConstraintInputSchema,
  RenameMissionStopInputSchema,
  SetMissionStopLockInputSchema,
  SetMissionBriefInputSchema,
  SetMissionConstraintFixedInputSchema,
  SetMissionTitleInputSchema,
  ToggleMissionConstraintInputSchema,
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

type MissionPatch = Pick<
  Mission,
  "context" | "planIteration" | "stops" | "timezone" | "title"
>

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

  const {
    expectedRevision: _expectedRevision,
    needs,
    reason,
    replacePlan,
    timezone,
    title,
    ...context
  } = parsed.data
  const target = replacePlan
    ? {
        ...mission,
        date: context.currentTime.slice(0, 10),
        events: [],
        id: PERSONAL_MISSION_ID,
        stops: [],
      }
    : mission
  return commit({
    actor: action.value.actor,
    at: context.currentTime,
    change: {
      summary: `${replacePlan ? `Started ${title}` : "Updated context"} — ${reason}`,
      type: "context_updated",
    },
    id,
    mission: target,
    patch: {
      context: {
        ...context,
        constraints: needs.map((need, index) => ({
          fixed: need.fixed,
          id: `constraint-${slug(need.label)}-${index + 1}`,
          label: need.label,
          status: "active",
        })),
        stage: "needs",
      },
      ...(replacePlan
        ? { planIteration: mission.planIteration + 1 }
        : {}),
      timezone,
      title,
    },
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

const constraintId = (mission: Mission, label: string, suffix: string) => {
  const base = `constraint-${slug(label)}-${slug(suffix)}`
  let candidate = base
  let sequence = 2
  while (
    mission.context.constraints.some((constraint) => constraint.id === candidate)
  ) {
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

const applyAddConstraint = ({
  action,
  id,
  mission,
}: ApplyParams<Extract<MissionAction, { type: "AddConstraint" }>>): MissionMutation => {
  const parsed = AddMissionConstraintInputSchema.safeParse(action.value.input)
  if (!parsed.success)
    return rejected(mission, "INVALID_INPUT", "The new requirement is invalid.")

  const conflict = stale(mission, parsed.data.expectedRevision)
  if (conflict !== null) return conflict
  if (action.value.actor !== "human")
    return rejected(
      mission,
      "FORBIDDEN_ACTION",
      "Only a person can edit the requirement checklist directly.",
    )
  if (mission.context.constraints.length >= 10)
    return rejected(
      mission,
      "LIMIT_REACHED",
      "A mission can contain at most 10 needs.",
    )
  if (
    mission.context.constraints.some(
      (constraint) =>
        constraint.label.toLocaleLowerCase() === parsed.data.label.toLocaleLowerCase(),
    )
  )
    return rejected(mission, "INVALID_INPUT", "That requirement already exists.")

  const added = {
    fixed: false,
    id: constraintId(mission, parsed.data.label, id()),
    label: parsed.data.label,
    status: "active" as const,
  }
  return commit({
    actor: action.value.actor,
    at: mission.context.currentTime,
    change: {
      summary: `Added requirement — ${added.label}`,
      type: "constraints_updated",
    },
    id,
    mission,
    patch: {
      context: {
        ...mission.context,
        constraints: [...mission.context.constraints, added],
      },
    },
  })
}

const applyConstraintFixed = ({
  action,
  id,
  mission,
}: ApplyParams<
  Extract<MissionAction, { type: "SetConstraintFixed" }>
>): MissionMutation => {
  const parsed = SetMissionConstraintFixedInputSchema.safeParse(action.value.input)
  if (!parsed.success)
    return rejected(mission, "INVALID_INPUT", "The fixed need update is invalid.")

  const conflict = stale(mission, parsed.data.expectedRevision)
  if (conflict !== null) return conflict
  if (action.value.actor !== "human")
    return rejected(
      mission,
      "FORBIDDEN_ACTION",
      "Only a person can mark a need as fixed directly.",
    )
  const constraint = mission.context.constraints.find(
    (item) => item.id === parsed.data.constraintId,
  )
  if (constraint === undefined)
    return rejected(
      mission,
      "CONSTRAINT_NOT_FOUND",
      "That need is not in this mission.",
    )

  return commit({
    actor: action.value.actor,
    at: mission.context.currentTime,
    change: {
      summary: `${constraint.label} marked ${parsed.data.fixed ? "fixed" : "flexible"}`,
      type: "constraints_updated",
    },
    id,
    mission,
    patch: {
      context: {
        ...mission.context,
        constraints: mission.context.constraints.map((item) =>
          item.id === constraint.id
            ? { ...item, fixed: parsed.data.fixed }
            : item,
        ),
      },
    },
  })
}

const applyRemoveConstraint = ({
  action,
  id,
  mission,
}: ApplyParams<Extract<MissionAction, { type: "RemoveConstraint" }>>): MissionMutation => {
  const parsed = RemoveMissionConstraintInputSchema.safeParse(action.value.input)
  if (!parsed.success)
    return rejected(mission, "INVALID_INPUT", "The need removal is invalid.")

  const conflict = stale(mission, parsed.data.expectedRevision)
  if (conflict !== null) return conflict
  if (action.value.actor !== "human")
    return rejected(
      mission,
      "FORBIDDEN_ACTION",
      "Only a person can remove a need directly.",
    )
  const constraint = mission.context.constraints.find(
    (item) => item.id === parsed.data.constraintId,
  )
  if (constraint === undefined)
    return rejected(
      mission,
      "CONSTRAINT_NOT_FOUND",
      "That need is not in this mission.",
    )

  return commit({
    actor: action.value.actor,
    at: mission.context.currentTime,
    change: {
      summary: `Removed need — ${constraint.label}`,
      type: "constraints_updated",
    },
    id,
    mission,
    patch: {
      context: {
        ...mission.context,
        constraints: mission.context.constraints.filter(
          (item) => item.id !== constraint.id,
        ),
      },
    },
  })
}

const applyToggleConstraint = ({
  action,
  id,
  mission,
}: ApplyParams<
  Extract<MissionAction, { type: "ToggleConstraint" }>
>): MissionMutation => {
  const parsed = ToggleMissionConstraintInputSchema.safeParse(action.value.input)
  if (!parsed.success)
    return rejected(mission, "INVALID_INPUT", "The requirement update is invalid.")

  const conflict = stale(mission, parsed.data.expectedRevision)
  if (conflict !== null) return conflict
  if (action.value.actor !== "human")
    return rejected(
      mission,
      "FORBIDDEN_ACTION",
      "Only a person can edit the requirement checklist directly.",
    )

  const constraint = mission.context.constraints.find(
    (item) => item.id === parsed.data.constraintId,
  )
  if (constraint === undefined)
    return rejected(
      mission,
      "CONSTRAINT_NOT_FOUND",
      "That requirement is not in this mission.",
    )

  const status = constraint.status === "active" ? "crossed" : "active"
  return commit({
    actor: action.value.actor,
    at: mission.context.currentTime,
    change: {
      summary: `${status === "crossed" ? "Crossed out" : "Restored"} requirement — ${constraint.label}`,
      type: "constraints_updated",
    },
    id,
    mission,
    patch: {
      context: {
        ...mission.context,
        constraints: mission.context.constraints.map((item) =>
          item.id === constraint.id ? { ...item, status } : item,
        ),
      },
    },
  })
}

const applyReorderConstraints = ({
  action,
  id,
  mission,
}: ApplyParams<
  Extract<MissionAction, { type: "ReorderConstraints" }>
>): MissionMutation => {
  const parsed = ReorderMissionConstraintsInputSchema.safeParse(action.value.input)
  if (!parsed.success)
    return rejected(mission, "INVALID_INPUT", "The requirement order is invalid.")

  const conflict = stale(mission, parsed.data.expectedRevision)
  if (conflict !== null) return conflict
  if (action.value.actor !== "human")
    return rejected(
      mission,
      "FORBIDDEN_ACTION",
      "Only a person can edit the requirement checklist directly.",
    )

  const currentIds = mission.context.constraints.map((constraint) => constraint.id)
  if (!sameIdsOnce(currentIds, parsed.data.orderedConstraintIds))
    return rejected(
      mission,
      "INVALID_ORDER",
      "Include every requirement exactly once.",
    )

  const constraintsById = new Map(
    mission.context.constraints.map((constraint) => [constraint.id, constraint]),
  )
  const constraints = []
  for (const constraintId of parsed.data.orderedConstraintIds) {
    const constraint = constraintsById.get(constraintId)
    if (constraint === undefined)
      return rejected(
        mission,
        "INVALID_ORDER",
        "A requirement is no longer in this mission.",
        true,
      )
    constraints.push(constraint)
  }
  return commit({
    actor: action.value.actor,
    at: mission.context.currentTime,
    change: {
      summary: "Reordered requirements",
      type: "constraints_updated",
    },
    id,
    mission,
    patch: { context: { ...mission.context, constraints } },
  })
}

const applyStopLock = ({
  action,
  id,
  mission,
}: ApplyParams<Extract<MissionAction, { type: "SetStopLock" }>>): MissionMutation => {
  const parsed = SetMissionStopLockInputSchema.safeParse(action.value.input)
  if (!parsed.success)
    return rejected(mission, "INVALID_INPUT", "The stop lock update is invalid.")

  const conflict = stale(mission, parsed.data.expectedRevision)
  if (conflict !== null) return conflict
  if (action.value.actor !== "human")
    return rejected(
      mission,
      "FORBIDDEN_ACTION",
      "Only a person can lock or unlock a stop.",
    )

  const stop = mission.stops.find((item) => item.id === parsed.data.stopId)
  if (stop === undefined)
    return rejected(mission, "STOP_NOT_FOUND", "That stop is not in this mission.")

  return commit({
    actor: action.value.actor,
    at: mission.context.currentTime,
    change: {
      stopId: stop.id,
      summary: `${stop.title} ${parsed.data.locked ? "locked" : "unlocked"}`,
      type: "stop_lock_updated",
    },
    id,
    mission,
    patch: {
      stops: mission.stops.map((item) =>
        item.id === stop.id ? { ...item, locked: parsed.data.locked } : item,
      ),
    },
  })
}

const applyTitle = ({
  action,
  id,
  mission,
}: ApplyParams<Extract<MissionAction, { type: "SetTitle" }>>): MissionMutation => {
  const parsed = SetMissionTitleInputSchema.safeParse(action.value.input)
  if (!parsed.success)
    return rejected(mission, "INVALID_INPUT", "The title update is invalid.")

  const conflict = stale(mission, parsed.data.expectedRevision)
  if (conflict !== null) return conflict
  if (action.value.actor !== "human")
    return rejected(
      mission,
      "FORBIDDEN_ACTION",
      "Only a person can rename the board directly.",
    )

  return commit({
    actor: action.value.actor,
    at: mission.context.currentTime,
    change: {
      summary: `Renamed board — ${parsed.data.title}`,
      type: "mission_title_updated",
    },
    id,
    mission,
    patch: { title: parsed.data.title },
  })
}

const applyBrief = ({
  action,
  id,
  mission,
}: ApplyParams<Extract<MissionAction, { type: "SetBrief" }>>): MissionMutation => {
  const parsed = SetMissionBriefInputSchema.safeParse(action.value.input)
  if (!parsed.success)
    return rejected(mission, "INVALID_INPUT", "The planning brief is invalid.")

  const conflict = stale(mission, parsed.data.expectedRevision)
  if (conflict !== null) return conflict
  if (action.value.actor !== "human")
    return rejected(
      mission,
      "FORBIDDEN_ACTION",
      "Only a person can edit the planning brief directly.",
    )

  return commit({
    actor: action.value.actor,
    at: mission.context.currentTime,
    change: {
      summary: "Updated planning needs",
      type: "context_updated",
    },
    id,
    mission,
    patch: {
      context: { ...mission.context, brief: parsed.data.brief },
    },
  })
}

const applyAddItem = ({
  action,
  id,
  mission,
}: ApplyParams<Extract<MissionAction, { type: "AddItem" }>>): MissionMutation => {
  const parsed = AddBoardItemInputSchema.safeParse(action.value.input)
  if (!parsed.success)
    return rejected(mission, "INVALID_INPUT", "The new item is invalid.")

  const conflict = stale(mission, parsed.data.expectedRevision)
  if (conflict !== null) return conflict
  if (action.value.actor !== "human")
    return rejected(
      mission,
      "FORBIDDEN_ACTION",
      "Only a person can add a board item directly.",
    )
  if (mission.stops.length >= 8)
    return rejected(mission, "LIMIT_REACHED", "A board can contain at most 8 items.")

  const added: MissionStop = {
    durationMinutes: 30,
    id: stopId(mission, parsed.data.title, id()),
    kind: "activity",
    location: mission.context.currentLocation,
    locked: false,
    rationale: "Added manually.",
    startsAt: mission.context.currentTime,
    status: "planned",
    title: parsed.data.title,
    travelMinutesFromPrevious: 0,
  }
  const firstLocked = mission.stops.findIndex((stop) => stop.locked)
  const insertAt = firstLocked === -1 ? mission.stops.length : firstLocked
  const stops = [
    ...mission.stops.slice(0, insertAt),
    added,
    ...mission.stops.slice(insertAt),
  ]
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
    patch: { stops },
  })
}

const applyRenameStop = ({
  action,
  id,
  mission,
}: ApplyParams<Extract<MissionAction, { type: "RenameStop" }>>): MissionMutation => {
  const parsed = RenameMissionStopInputSchema.safeParse(action.value.input)
  if (!parsed.success)
    return rejected(mission, "INVALID_INPUT", "The item title is invalid.")

  const conflict = stale(mission, parsed.data.expectedRevision)
  if (conflict !== null) return conflict
  if (action.value.actor !== "human")
    return rejected(
      mission,
      "FORBIDDEN_ACTION",
      "Only a person can rename a board item directly.",
    )
  const stop = mission.stops.find((item) => item.id === parsed.data.stopId)
  if (stop === undefined)
    return rejected(mission, "STOP_NOT_FOUND", "That item is not in this board.")
  if (stop.locked)
    return rejected(
      mission,
      "LOCKED_STOP",
      `${stop.title} is locked and cannot be renamed.`,
    )

  return commit({
    actor: action.value.actor,
    at: mission.context.currentTime,
    change: {
      stopId: stop.id,
      summary: `Renamed ${stop.title} — ${parsed.data.title}`,
      type: "stop_updated",
    },
    id,
    mission,
    patch: {
      stops: mission.stops.map((item) =>
        item.id === stop.id ? { ...item, title: parsed.data.title } : item,
      ),
    },
  })
}

const applyRemoveStop = ({
  action,
  id,
  mission,
}: ApplyParams<Extract<MissionAction, { type: "RemoveStop" }>>): MissionMutation => {
  const parsed = RemoveMissionStopInputSchema.safeParse(action.value.input)
  if (!parsed.success)
    return rejected(mission, "INVALID_INPUT", "The item removal is invalid.")

  const conflict = stale(mission, parsed.data.expectedRevision)
  if (conflict !== null) return conflict
  if (action.value.actor !== "human")
    return rejected(
      mission,
      "FORBIDDEN_ACTION",
      "Only a person can delete a board item directly.",
    )

  const stop = mission.stops.find((item) => item.id === parsed.data.stopId)
  if (stop === undefined)
    return rejected(mission, "STOP_NOT_FOUND", "That item is not in this board.")

  return commit({
    actor: action.value.actor,
    at: mission.context.currentTime,
    change: {
      stopId: stop.id,
      summary: `Deleted ${stop.title}`,
      type: "stop_removed",
    },
    id,
    mission,
    patch: { stops: mission.stops.filter((item) => item.id !== stop.id) },
  })
}

const applyRenameConstraint = ({
  action,
  id,
  mission,
}: ApplyParams<
  Extract<MissionAction, { type: "RenameConstraint" }>
>): MissionMutation => {
  const parsed = RenameMissionConstraintInputSchema.safeParse(action.value.input)
  if (!parsed.success)
    return rejected(mission, "INVALID_INPUT", "The requirement label is invalid.")

  const conflict = stale(mission, parsed.data.expectedRevision)
  if (conflict !== null) return conflict
  if (action.value.actor !== "human")
    return rejected(
      mission,
      "FORBIDDEN_ACTION",
      "Only a person can rename a requirement directly.",
    )
  const constraint = mission.context.constraints.find(
    (item) => item.id === parsed.data.constraintId,
  )
  if (constraint === undefined)
    return rejected(
      mission,
      "CONSTRAINT_NOT_FOUND",
      "That requirement is not in this board.",
    )
  if (
    mission.context.constraints.some(
      (item) =>
        item.id !== constraint.id &&
        item.label.toLocaleLowerCase() === parsed.data.label.toLocaleLowerCase(),
    )
  )
    return rejected(mission, "INVALID_INPUT", "That requirement already exists.")

  return commit({
    actor: action.value.actor,
    at: mission.context.currentTime,
    change: {
      summary: `Renamed requirement — ${parsed.data.label}`,
      type: "constraints_updated",
    },
    id,
    mission,
    patch: {
      context: {
        ...mission.context,
        constraints: mission.context.constraints.map((item) =>
          item.id === constraint.id ? { ...item, label: parsed.data.label } : item,
        ),
      },
    },
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
    case "AddConstraint":
      return applyAddConstraint({ action, id, mission })
    case "ToggleConstraint":
      return applyToggleConstraint({ action, id, mission })
    case "ReorderConstraints":
      return applyReorderConstraints({ action, id, mission })
    case "SetConstraintFixed":
      return applyConstraintFixed({ action, id, mission })
    case "RemoveConstraint":
      return applyRemoveConstraint({ action, id, mission })
    case "SetStopLock":
      return applyStopLock({ action, id, mission })
    case "SetTitle":
      return applyTitle({ action, id, mission })
    case "SetBrief":
      return applyBrief({ action, id, mission })
    case "AddItem":
      return applyAddItem({ action, id, mission })
    case "RenameStop":
      return applyRenameStop({ action, id, mission })
    case "RemoveStop":
      return applyRemoveStop({ action, id, mission })
    case "RenameConstraint":
      return applyRenameConstraint({ action, id, mission })
  }
}
