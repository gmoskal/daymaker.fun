import { COPY } from "./copy"
import type { Mission, MissionStop } from "./domain/mission"
import { futureStops } from "./domain/mission-transition"

export type WebMcpState =
  | { type: "checking" }
  | { type: "connected" }
  | { type: "unavailable" }
  | { type: "error" }

export type ViewAction =
  | { type: "CopyPrompt" }
  | { type: "Reset" }
  | { stopId: string; type: "SelectStop" }
  | {
      status: "completed" | "planned" | "skipped"
      stopId: string
      type: "SetStopStatus"
    }

export type RouteStopScreen = {
  coordinates: [number, number]
  id: string
  index: number
  selected: boolean
  title: string
}

export type TimelineStopScreen = {
  actionLabel: string
  duration: string
  id: string
  kind: string
  location: string
  locked: boolean
  note?: string
  rationale: string
  routeIndex: number | null
  selected: boolean
  source?: { title: string; url: string }
  status: MissionStop["status"]
  statusLabel: string
  time: string
  title: string
  travel: string | null
}

export type MissionScreen = {
  commitment: string
  context: {
    constraints: string[]
    currentLocation: string
    currentTime: string
    energy: string
  }
  copyLabel: string
  date: string
  events: Array<{
    actor: string
    at: string
    id: string
    summary: string
    type: string
  }>
  missionTitle: string
  revision: string
  route: RouteStopScreen[]
  timeline: TimelineStopScreen[]
  webMcp: { label: string; tone: "neutral" | "positive" | "warning" }
}

type PresentMissionParams = {
  copied: boolean
  mission: Mission
  selectedStopId: string | null
  webMcp: WebMcpState
}

const clock = (dateTime: string) => dateTime.slice(11, 16)
const titleCase = (value: string) =>
  `${value.charAt(0).toUpperCase()}${value.slice(1)}`

const durationLabel = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  if (hours === 0) return `${remainder}m`
  if (remainder === 0) return `${hours}h`
  return `${hours}h ${remainder}m`
}

const minutesBetween = (from: string, to: string) =>
  Math.max(0, Math.round((Date.parse(to) - Date.parse(from)) / 60_000))

const routeFor = (
  mission: Mission,
  selectedStopId: string | null,
): RouteStopScreen[] =>
  futureStops(mission).map((stop, index) => ({
    coordinates: [stop.location.lat, stop.location.lng],
    id: stop.id,
    index: index + 1,
    selected: stop.id === selectedStopId,
    title: stop.title,
  }))

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

export const presentMission = ({
  copied,
  mission,
  selectedStopId,
  webMcp,
}: PresentMissionParams): MissionScreen => {
  const route = routeFor(mission, selectedStopId)
  const routeIndices = new Map(route.map((stop) => [stop.id, stop.index]))
  const commitment = mission.stops.find((stop) => stop.locked)

  return {
    commitment:
      commitment === undefined
        ? "No locked commitment"
        : `Dinner ${clock(commitment.startsAt)} · ${durationLabel(
            minutesBetween(mission.context.currentTime, commitment.startsAt),
          )} left`,
    context: {
      constraints: mission.context.constraints,
      currentLocation: mission.context.currentLocation.label,
      currentTime: clock(mission.context.currentTime),
      energy: titleCase(mission.context.energy),
    },
    copyLabel: copied ? COPY.copiedPrompt : COPY.copyPrompt,
    date: new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(`${mission.date}T12:00:00Z`)),
    events: mission.events.map((event) => ({
      actor: titleCase(event.actor),
      at: clock(event.at),
      id: event.id,
      summary: event.summary,
      type: event.type.replaceAll("_", " "),
    })),
    missionTitle: mission.title,
    revision: `REV ${String(mission.revision).padStart(2, "0")}`,
    route,
    timeline: mission.stops.map((stop) => ({
      actionLabel:
        stop.status === "completed" || stop.status === "skipped"
          ? `Restore ${stop.title} to planned`
          : `Mark ${stop.title}`,
      duration: durationLabel(stop.durationMinutes),
      id: stop.id,
      kind: titleCase(stop.kind),
      location: stop.location.label,
      locked: stop.locked,
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
      travel:
        stop.travelMinutesFromPrevious === 0
          ? null
          : `${stop.travelMinutesFromPrevious}m transfer`,
    })),
    webMcp: webMcpBadge(webMcp),
  }
}
