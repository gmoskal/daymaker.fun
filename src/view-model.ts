import { COPY } from "./copy"
import type { Mission, MissionConstraint, MissionStop } from "./domain/mission"
import { futureStops } from "./domain/mission-transition"

export type WebMcpState =
  | { type: "checking" }
  | { type: "connected" }
  | { type: "unavailable" }
  | { type: "error" }

export const MISSION_PANELS = [
  { id: "plan", label: COPY.planTitle },
  { id: "context", label: COPY.contextTitle },
  { id: "route", label: COPY.mapTitle },
  { id: "history", label: COPY.activityTitle },
] as const

export type MissionPanel = (typeof MISSION_PANELS)[number]["id"]

export type ViewAction =
  | { type: "CopyPrompt" }
  | { type: "Reset" }
  | { panel: MissionPanel; type: "SelectPanel" }
  | { stopId: string; type: "SelectStop" }
  | { stopId: string; type: "ShowStopOnMap" }
  | {
      status: "completed" | "planned" | "skipped"
      stopId: string
      type: "SetStopStatus"
    }
  | { locked: boolean; stopId: string; type: "SetStopLock" }
  | { stopIds: string[]; type: "ReorderStops" }
  | { label: string; type: "AddConstraint" }
  | { constraintId: string; type: "ToggleConstraint" }
  | { constraintIds: string[]; type: "ReorderConstraints" }
  | { title: string; type: "SetTitle" }
  | { title: string; type: "AddItem" }
  | { stopId: string; title: string; type: "RenameStop" }
  | { constraintId: string; label: string; type: "RenameConstraint" }

export type RouteStopScreen = {
  coordinates: [number, number]
  id: string
  index: number
  location: string
  selected: boolean
  title: string
}

export type TimelineStopScreen = {
  actionLabel: string
  draggable: boolean
  id: string
  locked: boolean
  lockLabel: string
  note?: string
  rationale: string
  routeIndex: number | null
  selected: boolean
  source?: { title: string; url: string }
  status: MissionStop["status"]
  statusLabel: string
  time: string
  title: string
}

export type ConstraintScreen = Pick<MissionConstraint, "id" | "label" | "status">

type PlanWorkspace = {
  heading: string
  stops: TimelineStopScreen[]
  type: "plan"
}

type ContextWorkspace = {
  constraints: ConstraintScreen[]
  copyLabel: string
  currentLocation: string
  currentTime: string
  energy: string
  type: "context"
}

type RouteWorkspace = {
  route: RouteStopScreen[]
  type: "route"
}

type HistoryWorkspace = {
  events: Array<{
    actor: string
    at: string
    id: string
    summary: string
    type: string
  }>
  type: "history"
}

export type MissionWorkspaceScreen =
  | PlanWorkspace
  | ContextWorkspace
  | RouteWorkspace
  | HistoryWorkspace

export type MissionScreen = {
  date: {
    day: string
    month: string
    weekday: string
    year: string
  }
  missionTitle: string
  navigation: Array<{
    active: boolean
    id: MissionPanel
    label: string
  }>
  revision: string
  webMcp: { label: string; tone: "neutral" | "positive" | "warning" }
  workspace: MissionWorkspaceScreen
}

type PresentMissionParams = {
  copied: boolean
  mission: Mission
  panel: MissionPanel
  selectedStopId: string | null
  webMcp: WebMcpState
}

const clock = (dateTime: string) => dateTime.slice(11, 16)
const titleCase = (value: string) =>
  `${value.charAt(0).toUpperCase()}${value.slice(1)}`

const focusedStopId = (mission: Mission, selectedStopId: string | null) => {
  if (mission.stops.some((stop) => stop.id === selectedStopId))
    return selectedStopId
  return (
    mission.stops.find((stop) => stop.status === "active")?.id ??
    mission.stops.find((stop) => stop.status === "planned")?.id ??
    mission.stops[0]?.id ??
    null
  )
}

const routeFor = (
  mission: Mission,
  selectedStopId: string | null,
): RouteStopScreen[] =>
  futureStops(mission).map((stop, index) => ({
    coordinates: [stop.location.lat, stop.location.lng],
    id: stop.id,
    index: index + 1,
    location: stop.location.label,
    selected: stop.id === selectedStopId,
    title: stop.title,
  }))

const timelineFor = (
  mission: Mission,
  selectedStopId: string | null,
  route: RouteStopScreen[],
): TimelineStopScreen[] => {
  const routeIndices = new Map(route.map((stop) => [stop.id, stop.index]))
  return mission.stops.map((stop) => ({
    actionLabel:
      stop.status === "completed" || stop.status === "skipped"
        ? `Restore ${stop.title} to planned`
        : `Mark ${stop.title}`,
    draggable:
      !stop.locked && (stop.status === "active" || stop.status === "planned"),
    id: stop.id,
    locked: stop.locked,
    lockLabel: `${stop.locked ? COPY.unlock : COPY.lock} ${stop.title}`,
    ...(stop.note === undefined ? {} : { note: stop.note }),
    rationale: stop.rationale,
    routeIndex: routeIndices.get(stop.id) ?? null,
    selected: stop.id === selectedStopId,
    ...(stop.source === undefined
      ? {}
      : { source: { title: stop.source.title, url: stop.source.url } }),
    status: stop.status,
    statusLabel: titleCase(stop.status),
    time: clock(stop.startsAt),
    title: stop.title,
  }))
}

const webMcpBadge = (state: WebMcpState): MissionScreen["webMcp"] => {
  switch (state.type) {
    case "checking":
      return { label: COPY.webMcpChecking, tone: "neutral" }
    case "connected":
      return { label: COPY.webMcpConnected, tone: "positive" }
    case "unavailable":
      return { label: COPY.webMcpUnavailable, tone: "neutral" }
    case "error":
      return { label: COPY.webMcpError, tone: "warning" }
  }
}

const dateParts = (date: string, timezone: string): MissionScreen["date"] => {
  const value = new Date(`${date}T12:00:00Z`)
  const part = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-GB", { ...options, timeZone: timezone }).format(value)
  return {
    day: part({ day: "2-digit" }),
    month: part({ month: "long" }),
    weekday: part({ weekday: "long" }),
    year: part({ year: "numeric" }),
  }
}

const workspaceFor = (
  panel: MissionPanel,
  copied: boolean,
  mission: Mission,
  timeline: TimelineStopScreen[],
  route: RouteStopScreen[],
): MissionWorkspaceScreen => {
  switch (panel) {
    case "plan":
      return { heading: COPY.scheduleTitle, stops: timeline, type: "plan" }
    case "context":
      return {
        constraints: mission.context.constraints,
        copyLabel: copied ? COPY.copiedPrompt : COPY.copyPrompt,
        currentLocation: mission.context.currentLocation.label,
        currentTime: clock(mission.context.currentTime),
        energy: titleCase(mission.context.energy),
        type: "context",
      }
    case "route":
      return { route, type: "route" }
    case "history":
      return {
        events: mission.events.map((event) => ({
          actor: titleCase(event.actor),
          at: clock(event.at),
          id: event.id,
          summary: event.summary,
          type: event.type.replaceAll("_", " "),
        })),
        type: "history",
      }
  }
}

export const presentMission = ({
  copied,
  mission,
  panel,
  selectedStopId,
  webMcp,
}: PresentMissionParams): MissionScreen => {
  const selected = focusedStopId(mission, selectedStopId)
  const route = routeFor(mission, selected)
  const timeline = timelineFor(mission, selected, route)

  return {
    date: dateParts(mission.date, mission.timezone),
    missionTitle: mission.title,
    navigation: MISSION_PANELS.map((item) => ({
      active: item.id === panel,
      ...item,
    })),
    revision: `REV ${String(mission.revision).padStart(2, "0")}`,
    webMcp: webMcpBadge(webMcp),
    workspace: workspaceFor(panel, copied, mission, timeline, route),
  }
}

const sameIdsOnce = (actual: string[], proposed: string[]) =>
  actual.length === proposed.length &&
  new Set(proposed).size === proposed.length &&
  actual.every((id) => proposed.includes(id))

export const toHumanStopOrder = (mission: Mission, stopIds: string[]) => {
  const future = futureStops(mission)
  const movable = future.filter((stop) => !stop.locked)
  if (!sameIdsOnce(movable.map((stop) => stop.id), stopIds)) return null

  const movableById = new Map(movable.map((stop) => [stop.id, stop]))
  const queue = []
  for (const stopId of stopIds) {
    const stop = movableById.get(stopId)
    if (stop === undefined) return null
    queue.push(stop)
  }
  let nextMovable = 0
  const orderedStops = []
  for (const slot of future) {
    if (slot.locked) {
      orderedStops.push({ startsAt: slot.startsAt, stopId: slot.id })
      continue
    }
    const stop = queue[nextMovable]
    if (stop === undefined) return null
    nextMovable += 1
    orderedStops.push({ startsAt: slot.startsAt, stopId: stop.id })
  }

  return {
    expectedRevision: mission.revision,
    orderedStops,
    reason: "Reordered by the person using the Sidequest board.",
  }
}
