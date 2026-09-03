import { COPY } from "./copy"
import type { Mission, MissionConstraint, MissionStop } from "./domain/mission"
import {
  chronologicalStops,
  futureStops,
} from "./domain/mission-transition"
import {
  BLANK_LOCATION_LABEL,
  BLANK_MISSION_TITLE,
  isDemoMissionId,
  type DemoMissionId,
} from "./domain/seed"
import {
  DEFAULT_RESEARCH_DEPTH,
  type ResearchDepth,
} from "./research-depth"
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
  | { brief?: string; type: "CopyPrompt" }
  | { type: "CopySessionLink" }
  | { demoId?: DemoMissionId; type: "LoadDemo" }
  | { type: "NewPlan" }
  | { researchDepth: ResearchDepth; type: "SetResearchDepth" }
  | { panel: MissionPanel; type: "SelectPanel" }
  | { stopId: string; type: "ToggleStop" }
  | { label: string; type: "AddConstraint" }
  | { constraintId: string; type: "ToggleConstraint" }
  | { constraintIds: string[]; type: "ReorderConstraints" }
  | { constraintId: string; fixed: boolean; type: "SetConstraintFixed" }
  | { constraintId: string; type: "RemoveConstraint" }
  | { brief: string; type: "SetBrief" }
  | { constraintId: string; label: string; type: "RenameConstraint" }

export type TimelineStopScreen = {
  expanded: boolean
  id: string
  location: string
  note?: string
  rationale: string
  mapLinks?: { apple: string; google: string }
  source?: { title: string; url: string }
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
  stops: TimelineStopScreen[]
  type: "plan"
}

type ContextWorkspace = {
  brief: string
  canCopy: boolean
  canShareSession: boolean
  constraints: ConstraintScreen[]
  copyLabel: string
  researchDepth: ResearchDepth
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
  planIteration: string
  sessionLinkLabel: string
  updateMarker: string
  webMcp: { label: string; tone: "neutral" | "positive" | "warning" }
  workspace: MissionWorkspaceScreen
}

type PresentMissionParams = {
  copied: boolean
  copiedResearchDepth?: ResearchDepth
  expandedStopIds: string[]
  mission: Mission
  panel: MissionPanel
  researchDepth?: ResearchDepth
  sessionLinkCopied?: boolean
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
  expandedStopIds: string[],
  route: ScheduleMapPoint[],
): TimelineStopScreen[] => {
  const routeById = new Map(route.map((stop) => [stop.id, stop]))
  return chronologicalStops(mission.stops).map((stop) => {
    const mapPoint = routeById.get(stop.id)
    return {
      expanded: expandedStopIds.includes(stop.id),
      id: stop.id,
      location: stop.location.label,
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
      ...(stop.source === undefined
        ? {}
        : { source: { title: stop.source.title, url: stop.source.url } }),
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
  researchDepth: ResearchDepth,
  copiedResearchDepth: ResearchDepth,
): MissionWorkspaceScreen => {
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
        stops: timeline,
        type: "plan",
      }
    case "context":
      return {
        brief: mission.context.brief,
        canCopy:
          mission.context.stage === "brief"
            ? mission.context.brief.trim() !== ""
            : needsChanged || researchDepth !== copiedResearchDepth,
        canShareSession:
          mission.context.stage === "needs" &&
          mission.context.constraints.length > 0,
        constraints: mission.context.constraints,
        copyLabel:
          mission.context.stage === "brief"
            ? copied
              ? COPY.copiedPrompt
              : COPY.copyPrompt
            : copied
              ? COPY.copiedChanges
              : COPY.copyChanges,
        researchDepth,
        stage: mission.context.stage,
        type: "context",
      }
  }
}

export const presentMission = ({
  copied,
  copiedResearchDepth = DEFAULT_RESEARCH_DEPTH,
  expandedStopIds,
  mission,
  panel,
  researchDepth = DEFAULT_RESEARCH_DEPTH,
  sessionLinkCopied = false,
  viewerTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  webMcp,
}: PresentMissionParams): MissionScreen => {
  const route = routeFor(mission)
  const timeline = timelineFor(
    mission,
    expandedStopIds,
    mapPointsFor(mission.stops),
  )

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
    planIteration: COPY.planIteration.replace(
      "{number}",
      String(Math.max(1, mission.planIteration)),
    ),
    sessionLinkLabel: sessionLinkCopied
      ? COPY.copiedSessionLink
      : COPY.copySessionLink,
    updateMarker: formatUpdateMarker({
      timezone: viewerTimeZone,
      updatedAt: mission.updatedAt,
    }),
    webMcp: webMcpBadge(webMcp),
    workspace: workspaceFor(
      panel,
      copied,
      mission,
      timeline,
      route,
      researchDepth,
      copiedResearchDepth,
    ),
  }
}
