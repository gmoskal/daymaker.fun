import { COPY } from "./copy"
import type { Mission } from "./domain/mission"
import { chronologicalStops } from "./domain/mission-transition"
import {
  BLANK_LOCATION_LABEL,
  BLANK_MISSION_TITLE,
  isDemoMissionId,
} from "./domain/seed"
import { newPlanEntryUrl } from "./planning-entry"
import { PRODUCT_URL } from "./product"
import { toSessionUrl } from "./session-link"
import {
  DEFAULT_RESEARCH_DEPTH,
  researchInstructionFor,
  type ResearchDepth,
} from "./research-depth"

export type MissionPromptTarget =
  | { type: "create"; url: string }
  | { type: "update"; url: string }

const pendingNeedsDelta = (mission: Mission) => {
  const agentBoundary = mission.events.findIndex(
    (event) => event.actor === "agent",
  )
  const pendingEvents =
    agentBoundary === -1
      ? mission.events
      : mission.events.slice(0, agentBoundary)

  return pendingEvents
    .filter(
      (event) =>
        event.actor === "human" && event.type === "constraints_updated",
    )
    .reverse()
    .map((event) => event.summary)
}

const planningNeedsFor = (mission: Mission, target: MissionPromptTarget) => {
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
    lockedCommitments: chronologicalStops(mission.stops).filter(
      (stop) => stop.locked,
    ),
    handoffMode: target.type,
    missionId: mission.id,
    ...(mission.context.stage === "needs" ? { needs } : {}),
    ...(target.type === "update"
      ? { needsDelta: pendingNeedsDelta(mission) }
      : {}),
    revision: mission.revision,
    ...(isDemoMissionId(mission.id) ? { sampleData: true } : {}),
    timezone: mission.timezone,
    ...(mission.title === BLANK_MISSION_TITLE ? {} : { title: mission.title }),
  }
}

export const toMissionPrompt = (
  mission: Mission,
  researchDepth: ResearchDepth = DEFAULT_RESEARCH_DEPTH,
  target: MissionPromptTarget = {
    type: "create",
    url: newPlanEntryUrl(PRODUCT_URL),
  },
) =>
  [
    COPY.promptLanguage,
    COPY.promptOpen.replace("{url}", target.url),
    target.type === "create"
      ? COPY.promptCreateInstruction
      : COPY.promptUpdateInstruction,
    COPY.planningInstruction,
    researchInstructionFor(researchDepth),
    target.type === "create"
      ? COPY.promptCreateProtocol
      : COPY.promptUpdateProtocol.replace(
          "{newPlanUrl}",
          newPlanEntryUrl(PRODUCT_URL),
        ),
    COPY.promptResultProtocol,
    COPY.promptSnapshot,
    JSON.stringify(planningNeedsFor(mission, target), null, 2),
  ].join("\n\n")

export const toMissionHandoffPrompt = async (
  mission: Mission,
  researchDepth: ResearchDepth = DEFAULT_RESEARCH_DEPTH,
) => {
  if (mission.context.stage === "brief")
    return toMissionPrompt(mission, researchDepth)

  const sessionUrl = await toSessionUrl({
    mission,
    pageUrl: new URL("/schedule", PRODUCT_URL).toString(),
  })
  return toMissionPrompt(mission, researchDepth, {
    type: "update",
    url: sessionUrl,
  })
}
