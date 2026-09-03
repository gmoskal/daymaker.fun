import * as z from "zod"

import {
  AddMissionStopInputSchema,
  ReorderMissionStopsInputSchema,
  UpdateDayContextInputSchema,
  UpdateMissionStopInputSchema,
  type Mission,
  type MissionChange,
  type MissionError,
  type MissionMutation,
} from "./domain/mission"
import type { MissionStore } from "./store"

const EmptyInputSchema = z.strictObject({})

type AgentStop = {
  at: string
  id: string
  locked: boolean
  status: string
  title: string
} & Partial<{
  kind: string
  mins: number
  place: [string, number, number]
  source: [string, string]
  travel: number
}>

type AgentMission = {
  context: {
    energy: string
    limits: string[]
    now: string
    place: [string, number, number]
  }
  date: string
  id: string
  offset: string
  stops: AgentStop[]
  tz: string
  title: string
}

export type ToolMutationResult =
  | {
      changed: Omit<MissionChange, "summary">
      ok: true
      revision: number
      summary: string
    }
  | {
      error: Omit<MissionError, "revision">
      ok: false
      revision: number
    }

export type MissionStateResult = {
  mission: AgentMission
  ok: true
  revision: number
}

export type ToolResult = MissionStateResult | ToolMutationResult

export type WebMcpRegistration = {
  dispose: () => void
  supported: boolean
}

type ToolSpec<TSchema extends z.ZodType> = {
  annotations?: WebMCP.ToolAnnotations
  description: string
  execute: (store: MissionStore, input: z.infer<TSchema>) => ToolResult
  name: string
  schema: TSchema
}

const toInputSchema = (schema: z.ZodType): object => {
  const { $schema: _schema, ...inputSchema } = z.toJSONSchema(schema, {
    io: "input",
    target: "draft-07",
  })
  return inputSchema
}

const invalidInput = (store: MissionStore): ToolMutationResult => ({
  error: {
    code: "INVALID_INPUT",
    message: "Tool input is invalid. Check the schema and current revision.",
    retryable: true,
  },
  ok: false,
  revision: store.getSnapshot().revision,
})

const toToolResult = (mutation: MissionMutation): ToolMutationResult => {
  if (mutation.type === "rejected") {
    const { revision, ...error } = mutation.value
    return { error, ok: false, revision }
  }

  const { summary, ...changed } = mutation.value.change
  return {
    changed,
    ok: true,
    revision: mutation.value.mission.revision,
    summary,
  }
}

const clock = (dateTime: string) => dateTime.slice(11, 16)
const offset = (dateTime: string) =>
  dateTime.endsWith("Z") ? "Z" : dateTime.slice(-6)
const toAgentPlace = (location: Mission["context"]["currentLocation"]): [
  string,
  number,
  number,
] => [location.label, location.lat, location.lng]
const toAgentSource = (
  source: NonNullable<Mission["stops"][number]["source"]>,
): [string, string] => [source.title, source.url]

const toAgentStop = (stop: Mission["stops"][number]): AgentStop => ({
  at: clock(stop.startsAt),
  id: stop.id,
  locked: stop.locked,
  status: stop.status,
  title: stop.title,
  ...(stop.status === "completed" || stop.status === "skipped"
    ? {}
    : {
        kind: stop.kind,
        mins: stop.durationMinutes,
        place: toAgentPlace(stop.location),
        ...(stop.source === undefined
          ? {}
          : { source: toAgentSource(stop.source) }),
        travel: stop.travelMinutesFromPrevious,
      }),
})

const toMissionState = (mission: Mission): MissionStateResult => ({
  mission: {
    context: {
      energy: mission.context.energy,
      limits: mission.context.constraints
        .filter((constraint) => constraint.status === "active")
        .map((constraint) => constraint.label),
      now: clock(mission.context.currentTime),
      place: toAgentPlace(mission.context.currentLocation),
    },
    date: mission.date,
    id: mission.id,
    offset: offset(mission.context.currentTime),
    stops: mission.stops.map(toAgentStop),
    title: mission.title,
    tz: mission.timezone,
  },
  ok: true,
  revision: mission.revision,
})

const tool = <TSchema extends z.ZodType>(spec: ToolSpec<TSchema>) => ({
  annotations: spec.annotations,
  description: spec.description,
  name: spec.name,
  toDefinition: (store: MissionStore): WebMCP.ModelContextTool => ({
    ...(spec.annotations === undefined ? {} : { annotations: spec.annotations }),
    description: spec.description,
    execute: (rawInput) => {
      const input = spec.schema.safeParse(rawInput)
      return input.success ? spec.execute(store, input.data) : invalidInput(store)
    },
    inputSchema: toInputSchema(spec.schema),
    name: spec.name,
  }),
})

const TOOL_CATALOG = [
  tool({
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    description:
      "Read the current Sidequest mission: revision, context, stable stop IDs, statuses, times, coordinates, locked commitments, and sources. Use before changing the mission.",
    execute: (store) => toMissionState(store.getSnapshot()),
    name: "get_mission_state",
    schema: EmptyInputSchema,
  }),
  tool({
    description:
      "Set title, timezone, time, location, energy, and constraints. Can replace the plan atomically or update it in place. Returns the new revision.",
    execute: (store, input) =>
      toToolResult(
        store.dispatch({
          type: "UpdateContext",
          value: { actor: "agent", input },
        }),
      ),
    name: "update_day_context",
    schema: UpdateDayContextInputSchema,
  }),
  tool({
    description:
      "Set one existing stop's planned, active, completed, or skipped status by stable ID. Locked commitments stay unchanged. Returns the new board revision.",
    execute: (store, input) =>
      toToolResult(
        store.dispatch({
          type: "UpdateStop",
          value: { actor: "agent", input },
        }),
      ),
    name: "update_mission_stop",
    schema: UpdateMissionStopInputSchema,
  }),
  tool({
    description:
      "Add one researched stop with time, duration, coordinates, travel estimate, rationale, and HTTPS source. Updates the board and returns its stop ID and revision.",
    execute: (store, input) =>
      toToolResult(
        store.dispatch({
          type: "AddStop",
          value: { actor: "agent", input },
        }),
      ),
    name: "add_mission_stop",
    schema: AddMissionStopInputSchema,
  }),
  tool({
    description:
      "Set the order and start times of every active or planned stop. Include each future stop once; locked commitments keep their time. Returns the new revision.",
    execute: (store, input) =>
      toToolResult(
        store.dispatch({
          type: "ReorderStops",
          value: { actor: "agent", input },
        }),
      ),
    name: "reorder_mission_stops",
    schema: ReorderMissionStopsInputSchema,
  }),
] as const

export type ToolName = (typeof TOOL_CATALOG)[number]["name"]
export const TOOL_NAMES: ToolName[] = TOOL_CATALOG.map((spec) => spec.name)

export const registerMissionTools = async (
  store: MissionStore,
): Promise<WebMcpRegistration> => {
  const modelContext = document.modelContext
  if (typeof modelContext?.registerTool !== "function")
    return { dispose: () => undefined, supported: false }

  const controller = new AbortController()
  try {
    for (const spec of TOOL_CATALOG) {
      await modelContext.registerTool(spec.toDefinition(store), {
        signal: controller.signal,
      })
    }
  } catch (error) {
    controller.abort()
    throw error
  }

  return {
    dispose: () => controller.abort(),
    supported: true,
  }
}
