import { COPY, DEMO_PROMPTS } from "./copy"
import type { Mission, MissionConstraint, MissionStop } from "./domain/mission"
import { futureStops } from "./domain/mission-transition"
import {
  BLANK_LOCATION_LABEL,
  isDemoMissionId,
  type DemoMissionId,
} from "./domain/seed"

export type WebMcpState =
  | { type: "checking" }
  | { type: "connected" }
  | { type: "unavailable" }
  | { type: "error" }

export const MISSION_PANELS = [
  { id: "plan", label: COPY.planTitle, path: "/plan" },
  { id: "context", label: COPY.contextTitle, path: "/context" },
  { id: "route", label: COPY.mapTitle, path: "/route" },
] as const

export type MissionPanel = (typeof MISSION_PANELS)[number]["id"]

export const missionPanelForPath = (pathname: string): MissionPanel =>
  MISSION_PANELS.find((panel) => panel.path === pathname)?.id ?? "plan"

export const missionPathFor = (panel: MissionPanel) =>
  MISSION_PANELS.find((item) => item.id === panel)?.path ?? "/plan"

export type ViewAction =
  | { prompt: string; type: "CopyPrompt" }
  | { demoId?: DemoMissionId; type: "LoadDemo" }
  | { type: "NewPlan" }
  | { panel: MissionPanel; type: "SelectPanel" }
  | { stopId: string; type: "SelectStop" }
  | { stopId: string; type: "ToggleStopActions" }
  | { stopId: string; type: "DeleteStop" }
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
  copyLabel: string
  emptyHint: string
  heading: string
  prompt: string
  stops: TimelineStopScreen[]
  type: "plan"
}

type ContextWorkspace = {
  constraints: ConstraintScreen[]
  copyLabel: string
  currentLocation: string
  currentTime: string
  energy: string
  prompt: string
  type: "context"
}

type RouteWorkspace = {
  origin: {
    coordinates: [number, number]
    label: string
  }
  route: RouteStopScreen[]
  type: "route"
}

export type MissionWorkspaceScreen =
  | PlanWorkspace
  | ContextWorkspace
  | RouteWorkspace

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
    path: string
  }>
  primaryAction: {
    label: string
    type: "LoadDemo" | "NewPlan"
  }
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

const clock = (dateTime: string, timezone: string) =>
  new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(dateTime))
const titleCase = (value: string) =>
  `${value.charAt(0).toUpperCase()}${value.slice(1)}`

const focusedStopId = (mission: Mission, selectedStopId: string | null) => {
  if (mission.stops.some((stop) => stop.id === selectedStopId))
    return selectedStopId
  return null
}

const routeFor = (
  mission: Mission,
  selectedStopId: string | null,
): RouteStopScreen[] =>
  futureStops(mission)
    .filter((stop) => stop.location.label !== BLANK_LOCATION_LABEL)
    .map((stop, index) => ({
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
    statusLabel: `${titleCase(stop.status)}${stop.locked ? ` · ${COPY.locked}` : ""}`,
    time: clock(stop.startsAt, mission.timezone),
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

const dateParts = (date: string): MissionScreen["date"] => {
  const value = new Date(`${date}T12:00:00Z`)
  const part = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-GB", { ...options, timeZone: "UTC" }).format(value)
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
  const prompt = isDemoMissionId(mission.id)
    ? DEMO_PROMPTS[mission.id]
    : COPY.freshPrompt
  switch (panel) {
    case "plan":
      return {
        copyLabel: copied ? COPY.copiedPrompt : COPY.copyPrompt,
        emptyHint: COPY.emptyPlanHint,
        heading: COPY.scheduleTitle,
        prompt,
        stops: timeline,
        type: "plan",
      }
    case "context":
      return {
        constraints: mission.context.constraints,
        copyLabel: copied ? COPY.copiedPrompt : COPY.copyPrompt,
        currentLocation: mission.context.currentLocation.label,
        currentTime: clock(mission.context.currentTime, mission.timezone),
        energy: titleCase(mission.context.energy),
        prompt,
        type: "context",
      }
    case "route":
      return {
        origin: {
          coordinates: [
            mission.context.currentLocation.lat,
            mission.context.currentLocation.lng,
          ],
          label: mission.context.currentLocation.label,
        },
        route,
        type: "route",
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
    date: dateParts(mission.date),
    missionTitle: mission.title,
    navigation: MISSION_PANELS.map((item) => ({
      active: item.id === panel,
      ...item,
    })),
    primaryAction:
      isDemoMissionId(mission.id)
        ? { label: COPY.newPlan, type: "NewPlan" }
        : { label: COPY.loadDemo, type: "LoadDemo" },
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
