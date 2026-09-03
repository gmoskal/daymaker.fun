import { COPY, SIDEQUEST_URL } from "./copy"
import type { Mission } from "./domain/mission"
import {
  BLANK_LOCATION_LABEL,
  BLANK_MISSION_TITLE,
  isDemoMissionId,
} from "./domain/seed"
import { newPlanEntryUrl } from "./planning-entry"

const planningNeedsFor = (mission: Mission) => {
  const needs = mission.context.constraints
    .filter((constraint) => constraint.status === "active")
    .map(({ fixed, label }) => ({ fixed, label }))

  return {
    brief: mission.context.brief,
    ...(mission.context.currentLocation.label === BLANK_LOCATION_LABEL
      ? {}
      : { currentLocation: mission.context.currentLocation }),
    currentTime: mission.context.currentTime,
    date: mission.date,
    lockedCommitments: mission.stops.filter((stop) => stop.locked),
    missionId: mission.id,
    ...(mission.context.stage === "needs" ? { needs } : {}),
    revision: mission.revision,
    ...(isDemoMissionId(mission.id) ? { sampleData: true } : {}),
    timezone: mission.timezone,
    ...(mission.title === BLANK_MISSION_TITLE ? {} : { title: mission.title }),
  }
}

export const toMissionPrompt = (mission: Mission) =>
  [
    COPY.promptLanguage,
    COPY.promptOpen.replace("{url}", newPlanEntryUrl(SIDEQUEST_URL)),
    COPY.planningInstruction,
    COPY.promptProtocol,
    COPY.promptSnapshot,
    JSON.stringify(planningNeedsFor(mission), null, 2),
  ].join("\n\n")
