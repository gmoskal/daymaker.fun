import { COPY } from "./copy"
import type { Mission, MissionConstraint, MissionStop } from "./domain/mission"
import { futureStops } from "./domain/mission-transition"
import {
  BLANK_LOCATION_LABEL,
  BLANK_MISSION_TITLE,
  isDemoMissionId,
  type DemoMissionId,
} from "./domain/seed"
import { toMissionPrompt } from "./mission-prompt"
import {
  appleMapsUrl,
  googleMapsUrl,
  googleScheduleUrl,
  type MapPoint,
} from "./map-links"

export type WebMcpState =
  | { type: "checking" }
  | { type: "connected" }
  | { type: "unavailable" }
  | { type: "error" }

export const MISSION_PANELS = [
  { id: "context", label: COPY.contextTitle, path: "/needs" },
  { id: "plan", label: COPY.planTitle, path: "/schedule" },
] as const

export type MissionPanel = (typeof MISSION_PANELS)[number]["id"]

export const missionPanelForPath = (pathname: string): MissionPanel =>
  MISSION_PANELS.find((panel) => panel.path === pathname)?.id ?? "context"

export const missionPathFor = (panel: MissionPanel) =>
  MISSION_PANELS.find((item) => item.id === panel)?.path ?? "/needs"

export type ViewAction =
  | { brief?: string; prompt: string; type: "CopyPrompt" }
  | { demoId?: DemoMissionId; type: "LoadDemo" }
  | { type: "NewPlan" }
  | { panel: MissionPanel; type: "SelectPanel" }
  | { stopId: string; type: "ToggleStopActions" }
  | { stopId: string; type: "DeleteStop" }
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
  | { constraintId: string; fixed: boolean; type: "SetConstraintFixed" }
  | { constraintId: string; type: "RemoveConstraint" }
  | { brief: string; type: "SetBrief" }
  | { title: string; type: "SetTitle" }
  | { title: string; type: "AddItem" }
  | { stopId: string; title: string; type: "RenameStop" }
  | { constraintId: string; label: string; type: "RenameConstraint" }

export type TimelineStopScreen = {
  actionLabel: string
  draggable: boolean
  id: string
  locked: boolean
  lockLabel: string
  note?: string
  rationale: string
  mapLinks?: { apple: string; google: string }
  selected: boolean
  source?: { title: string; url: string }
  status: MissionStop["status"]
  statusLabel: string
  time: string
  title: string
}

export type ConstraintScreen = Pick<
  MissionConstraint,
  "fixed" | "id" | "label" | "status"
>

type PlanWorkspace = {
  canCopy: boolean
  copyLabel: string
  emptyHint: string
  heading: string
  mapUrl: string | null
  prompt: string
  stops: TimelineStopScreen[]
  type: "plan"
}

type ContextWorkspace = {
  brief: string
  canCopy: boolean
  constraints: ConstraintScreen[]
  copyLabel: string
  prompt: string
  stage: Mission["context"]["stage"]
  type: "context"
}

export type MissionWorkspaceScreen = PlanWorkspace | ContextWorkspace

export type MissionScreen = {
  date: {
    day: string
    month: string
    weekday: string
    year: string
  }
  missionTitle: string
  situation: {
    currentLocation: string | null
  }
  navigation: Array<{
    active: boolean
    disabled: boolean
    id: MissionPanel
    label: string
    path: string
  }>
  primaryAction: {
    label: string
    type: "LoadDemo" | "NewPlan"
  }
  revision: string
  updateMarker: string
  webMcp: { label: string; tone: "neutral" | "positive" | "warning" }
  workspace: MissionWorkspaceScreen
}

type PresentMissionParams = {
  copied: boolean
  mission: Mission
  panel: MissionPanel
  selectedStopId: string | null
  viewerTimeZone?: string
  webMcp: WebMcpState
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const

const clock = (dateTime: string, timezone: string) =>
  new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(dateTime))
const titleCase = (value: string) =>
  `${value.charAt(0).toUpperCase()}${value.slice(1)}`

type FormatUpdateMarkerParams = {
  timezone: string
  updatedAt: string
}

const formatUpdateMarker = ({
  timezone,
  updatedAt,
}: FormatUpdateMarkerParams) => {
  const value = new Date(updatedAt)
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    day: "numeric",
    month: "numeric",
    timeZone: timezone,
    year: "numeric",
  }).formatToParts(value)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    dateParts.find((item) => item.type === type)?.value ?? ""
  const month = MONTHS[Number(part("month")) - 1] ?? ""
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    timeZone: timezone,
    timeZoneName: "short",
  }).format(value)
  return `${COPY.release} · ${COPY.updated} ${Number(part("day"))} ${month} ${part("year")} · ${time}`
}

const focusedStopId = (mission: Mission, selectedStopId: string | null) => {
  if (mission.stops.some((stop) => stop.id === selectedStopId))
    return selectedStopId
  return null
}

type ScheduleMapPoint = MapPoint & { id: string }

const mapPointsFor = (stops: MissionStop[]): ScheduleMapPoint[] =>
  stops
    .filter((stop) => stop.location.label !== BLANK_LOCATION_LABEL)
    .map((stop) => ({
      coordinates: [stop.location.lat, stop.location.lng],
      id: stop.id,
      title: stop.title,
    }))

const routeFor = (mission: Mission): ScheduleMapPoint[] =>
  mapPointsFor(futureStops(mission))

const timelineFor = (
  mission: Mission,
  selectedStopId: string | null,
  route: ScheduleMapPoint[],
): TimelineStopScreen[] => {
  const routeById = new Map(route.map((stop) => [stop.id, stop]))
  return mission.stops.map((stop) => {
    const mapPoint = routeById.get(stop.id)
    return {
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
      ...(mapPoint === undefined
        ? {}
        : {
            mapLinks: {
              apple: appleMapsUrl(mapPoint),
              google: googleMapsUrl(mapPoint),
            },
          }),
      selected: stop.id === selectedStopId,
      ...(stop.source === undefined
        ? {}
        : { source: { title: stop.source.title, url: stop.source.url } }),
      status: stop.status,
      statusLabel: `${titleCase(stop.status)}${stop.locked ? ` · ${COPY.locked}` : ""}`,
      time: clock(stop.startsAt, mission.timezone),
      title: stop.title,
    }
  })
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
  route: ScheduleMapPoint[],
): MissionWorkspaceScreen => {
  const prompt = toMissionPrompt(mission)
  const latestNeedsEvent = mission.events.find(
    (event) =>
      event.type === "constraints_updated" || event.type === "context_updated",
  )
  const needsChanged = latestNeedsEvent?.type === "constraints_updated"
  switch (panel) {
    case "plan":
      return {
        canCopy: mission.context.brief.trim() !== "",
        copyLabel: copied ? COPY.copiedPrompt : COPY.copyPrompt,
        emptyHint: COPY.emptyPlanHint,
        heading: COPY.scheduleTitle,
        mapUrl: googleScheduleUrl(
          {
            coordinates: [
              mission.context.currentLocation.lat,
              mission.context.currentLocation.lng,
            ],
            title: mission.context.currentLocation.label,
          },
          route,
        ),
        prompt,
        stops: timeline,
        type: "plan",
      }
    case "context":
      return {
        brief: mission.context.brief,
        canCopy:
          mission.context.stage === "brief"
            ? mission.context.brief.trim() !== ""
            : needsChanged,
        constraints: mission.context.constraints,
        copyLabel:
          mission.context.stage === "brief"
            ? copied
              ? COPY.copiedPrompt
              : COPY.copyPrompt
            : copied
              ? COPY.copiedChanges
              : COPY.copyChanges,
        prompt,
        stage: mission.context.stage,
        type: "context",
      }
  }
}

export const presentMission = ({
  copied,
  mission,
  panel,
  selectedStopId,
  viewerTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  webMcp,
}: PresentMissionParams): MissionScreen => {
  const selected = focusedStopId(mission, selectedStopId)
  const route = routeFor(mission)
  const timeline = timelineFor(mission, selected, mapPointsFor(mission.stops))

  return {
    date: dateParts(mission.date),
    missionTitle: mission.title === BLANK_MISSION_TITLE ? "" : mission.title,
    situation: {
      currentLocation:
        mission.context.currentLocation.label === BLANK_LOCATION_LABEL
          ? null
          : mission.context.currentLocation.label,
    },
    navigation: MISSION_PANELS.map((item) => ({
      active: item.id === panel,
      disabled: item.id === "plan" && mission.context.stage === "brief",
      ...item,
    })),
    primaryAction:
      isDemoMissionId(mission.id)
        ? { label: COPY.newPlan, type: "NewPlan" }
        : { label: COPY.loadDemo, type: "LoadDemo" },
    revision: `REV ${String(mission.revision).padStart(2, "0")}`,
    updateMarker: formatUpdateMarker({
      timezone: viewerTimeZone,
      updatedAt: mission.updatedAt,
    }),
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
