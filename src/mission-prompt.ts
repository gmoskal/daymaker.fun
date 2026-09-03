import { COPY, PACE_LABELS, SIDEQUEST_URL } from "./copy"
import type { Mission } from "./domain/mission"

const planningNeedsFor = (mission: Mission) => ({
  brief: mission.context.brief,
  currentLocation: mission.context.currentLocation,
  currentTime: mission.context.currentTime,
  date: mission.date,
  lockedCommitments: mission.stops.filter((stop) => stop.locked),
  missionId: mission.id,
  mustHaves: mission.context.constraints
    .filter((constraint) => constraint.status === "active")
    .map(({ fixed, label }) => ({ fixed, label })),
  pace: PACE_LABELS[mission.context.energy].toLowerCase(),
  revision: mission.revision,
  timezone: mission.timezone,
  title: mission.title,
})

export const toMissionPrompt = (mission: Mission) =>
  [
    COPY.promptOpen.replace("{url}", SIDEQUEST_URL),
    COPY.planningInstruction,
    COPY.promptProtocol,
    COPY.promptSnapshot,
    JSON.stringify(planningNeedsFor(mission), null, 2),
  ].join("\n\n")
