import * as z from "zod"

export const STOP_STATUSES = [
  "planned",
  "active",
  "completed",
  "skipped",
] as const
export const STOP_KINDS = [
  "activity",
  "service",
  "meal",
  "transition",
] as const
export const ENERGY_LEVELS = ["high", "medium", "low"] as const
export const CONSTRAINT_STATUSES = ["active", "crossed"] as const
export const ACTORS = ["human", "agent", "system"] as const
export const EVENT_TYPES = [
  "context_updated",
  "constraints_updated",
  "mission_title_updated",
  "stop_updated",
  "stop_lock_updated",
  "stop_added",
  "stops_reordered",
] as const

const htmlPattern = /[<>]/
const text = (maxLength: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(maxLength)
    .refine((value) => !htmlPattern.test(value), "HTML is not allowed")
const optionalText = (maxLength: number) => text(maxLength).optional()
const dateTime = z
  .iso.datetime({ offset: true })
  .describe("ISO 8601 date-time with an explicit UTC offset.")
const httpsUrl = z
  .url()
  .refine((value) => new URL(value).protocol === "https:", "Use an HTTPS URL")
  .describe("Public HTTPS source URL.")
const constraintTextList = z
  .array(text(80))
  .max(6)
  .refine((values) => new Set(values).size === values.length, {
    message: "Constraints must be unique",
  })

const identifier = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

export const MissionConstraintSchema = z.strictObject({
  id: text(80),
  label: text(80),
  status: z.enum(CONSTRAINT_STATUSES),
})

const storedConstraintSchema = z.union([
  MissionConstraintSchema,
  text(80).transform((label) => ({
    id: `constraint-${identifier(label)}`,
    label,
    status: "active" as const,
  })),
])

const missionConstraintList = z
  .array(storedConstraintSchema)
  .max(6)
  .refine((values) => new Set(values.map((value) => value.id)).size === values.length, {
    message: "Constraint IDs must be unique",
  })
  .refine(
    (values) =>
      new Set(values.map((value) => value.label.toLocaleLowerCase())).size ===
      values.length,
    { message: "Constraint labels must be unique" },
  )

export const GeoPointSchema = z.strictObject({
  label: text(80).describe("Human-readable place or address."),
  lat: z.number().min(-90).max(90).describe("Latitude from -90 to 90."),
  lng: z.number().min(-180).max(180).describe("Longitude from -180 to 180."),
})

export const SourceRefSchema = z.strictObject({
  checkedAt: dateTime,
  title: text(100).describe("Short source title."),
  url: httpsUrl,
})

export const MissionStopSchema = z.strictObject({
  durationMinutes: z.number().int().min(5).max(720),
  id: text(80),
  kind: z.enum(STOP_KINDS),
  location: GeoPointSchema,
  locked: z.boolean(),
  note: optionalText(240),
  rationale: text(240),
  source: SourceRefSchema.optional(),
  startsAt: dateTime,
  status: z.enum(STOP_STATUSES),
  title: text(80),
  travelMinutesFromPrevious: z.number().int().min(0).max(240),
})

export const DayContextSchema = z.strictObject({
  constraints: missionConstraintList,
  currentLocation: GeoPointSchema,
  currentTime: dateTime,
  energy: z.enum(ENERGY_LEVELS),
})

export const MissionEventSchema = z.strictObject({
  actor: z.enum(ACTORS),
  at: dateTime,
  id: text(80),
  summary: text(180),
  type: z.enum(EVENT_TYPES),
})

export const MissionSchema = z.strictObject({
  context: DayContextSchema,
  date: z.iso.date(),
  events: z.array(MissionEventSchema).max(20),
  id: text(80),
  revision: z.number().int().nonnegative(),
  schemaVersion: z.literal(1),
  stops: z.array(MissionStopSchema).min(1).max(8),
  timezone: text(80),
  title: text(80),
})

const ExpectedRevisionSchema = z.strictObject({
  expectedRevision: z
    .number()
    .int()
    .nonnegative()
    .describe("Revision returned by the latest mission read or write."),
})

export const UpdateDayContextInputSchema = ExpectedRevisionSchema.extend({
  constraints: constraintTextList.describe("Current limits the new plan must respect."),
  currentLocation: GeoPointSchema.describe("Where the group is now."),
  currentTime: dateTime,
  energy: z.enum(ENERGY_LEVELS).describe("Current group energy."),
  reason: text(160).describe("Why the context changed."),
})

export const UpdateMissionStopInputSchema = ExpectedRevisionSchema.extend({
  note: optionalText(240).describe("Optional concise user-facing note."),
  reason: text(160).describe("Why this status fits the current mission."),
  status: z.enum(STOP_STATUSES).describe("New lifecycle status."),
  stopId: text(80).describe("Stable ID from get_mission_state."),
})

export const AddMissionStopInputSchema = ExpectedRevisionSchema.extend({
  durationMinutes: z.number().int().min(5).max(720).describe("Planned duration in minutes."),
  kind: z.enum(STOP_KINDS).describe("Operational kind of stop."),
  location: GeoPointSchema.describe("Place and map coordinates."),
  note: optionalText(240).describe("Optional concise user-facing note."),
  rationale: text(240).describe("Why this stop fits the current constraints."),
  source: SourceRefSchema.describe("Evidence used to choose this stop."),
  startsAt: dateTime,
  title: text(80).describe("Concise user-facing stop name."),
  travelMinutesFromPrevious: z
    .number()
    .int()
    .min(0)
    .max(240)
    .describe("Estimated travel minutes from the prior stop."),
})

export const ReorderMissionStopsInputSchema = ExpectedRevisionSchema.extend({
  orderedStops: z
    .array(
      z.strictObject({
        startsAt: dateTime,
        stopId: text(80).describe("Stable future stop ID."),
      }),
    )
    .min(1)
    .max(8)
    .describe("Every active or planned stop, once, in the new order."),
  reason: text(160).describe("Why this order fits the mission."),
})

export const AddMissionConstraintInputSchema = ExpectedRevisionSchema.extend({
  label: text(80),
})

export const ToggleMissionConstraintInputSchema = ExpectedRevisionSchema.extend({
  constraintId: text(80),
})

export const ReorderMissionConstraintsInputSchema = ExpectedRevisionSchema.extend({
  orderedConstraintIds: z.array(text(80)).min(1).max(6),
})

export const SetMissionStopLockInputSchema = ExpectedRevisionSchema.extend({
  locked: z.boolean(),
  stopId: text(80),
})

export const SetMissionTitleInputSchema = ExpectedRevisionSchema.extend({
  title: text(80),
})

export const AddBoardItemInputSchema = ExpectedRevisionSchema.extend({
  title: text(80),
})

export const RenameMissionStopInputSchema = ExpectedRevisionSchema.extend({
  stopId: text(80),
  title: text(80),
})

export const RenameMissionConstraintInputSchema = ExpectedRevisionSchema.extend({
  constraintId: text(80),
  label: text(80),
})

export type Mission = z.infer<typeof MissionSchema>
export type MissionStop = z.infer<typeof MissionStopSchema>
export type MissionConstraint = z.infer<typeof MissionConstraintSchema>
export type Actor = z.infer<typeof MissionEventSchema>["actor"]
export type UpdateDayContextInput = z.infer<
  typeof UpdateDayContextInputSchema
>
export type UpdateMissionStopInput = z.infer<
  typeof UpdateMissionStopInputSchema
>
export type AddMissionStopInput = z.infer<typeof AddMissionStopInputSchema>
export type ReorderMissionStopsInput = z.infer<
  typeof ReorderMissionStopsInputSchema
>
export type AddMissionConstraintInput = z.infer<
  typeof AddMissionConstraintInputSchema
>
export type ToggleMissionConstraintInput = z.infer<
  typeof ToggleMissionConstraintInputSchema
>
export type ReorderMissionConstraintsInput = z.infer<
  typeof ReorderMissionConstraintsInputSchema
>
export type SetMissionStopLockInput = z.infer<
  typeof SetMissionStopLockInputSchema
>
export type SetMissionTitleInput = z.infer<typeof SetMissionTitleInputSchema>
export type AddBoardItemInput = z.infer<typeof AddBoardItemInputSchema>
export type RenameMissionStopInput = z.infer<
  typeof RenameMissionStopInputSchema
>
export type RenameMissionConstraintInput = z.infer<
  typeof RenameMissionConstraintInputSchema
>

type ActionValue<TInput> = {
  actor: Actor
  input: TInput
}

export type MissionAction =
  | { type: "UpdateContext"; value: ActionValue<UpdateDayContextInput> }
  | { type: "UpdateStop"; value: ActionValue<UpdateMissionStopInput> }
  | { type: "AddStop"; value: ActionValue<AddMissionStopInput> }
  | { type: "ReorderStops"; value: ActionValue<ReorderMissionStopsInput> }
  | { type: "AddConstraint"; value: ActionValue<AddMissionConstraintInput> }
  | { type: "ToggleConstraint"; value: ActionValue<ToggleMissionConstraintInput> }
  | {
      type: "ReorderConstraints"
      value: ActionValue<ReorderMissionConstraintsInput>
    }
  | { type: "SetStopLock"; value: ActionValue<SetMissionStopLockInput> }
  | { type: "SetTitle"; value: ActionValue<SetMissionTitleInput> }
  | { type: "AddItem"; value: ActionValue<AddBoardItemInput> }
  | { type: "RenameStop"; value: ActionValue<RenameMissionStopInput> }
  | {
      type: "RenameConstraint"
      value: ActionValue<RenameMissionConstraintInput>
    }

export const MISSION_ERROR_CODES = [
  "INVALID_INPUT",
  "STALE_REVISION",
  "STOP_NOT_FOUND",
  "CONSTRAINT_NOT_FOUND",
  "LOCKED_STOP",
  "FORBIDDEN_ACTION",
  "INVALID_ORDER",
  "LIMIT_REACHED",
] as const

export type MissionError = {
  code: (typeof MISSION_ERROR_CODES)[number]
  message: string
  retryable: boolean
  revision: number
}

export type MissionChange = {
  stopId?: string
  summary: string
  type: (typeof EVENT_TYPES)[number]
}

export type MissionMutation =
  | {
      type: "applied"
      value: { change: MissionChange; mission: Mission }
    }
  | { type: "rejected"; value: MissionError }
