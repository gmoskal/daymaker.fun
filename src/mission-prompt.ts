import { COPY, DEMO_INSTRUCTIONS, SIDEQUEST_URL } from "./copy"
import type { Mission } from "./domain/mission"
import { isDemoMissionId } from "./domain/seed"

const instructionFor = (mission: Mission) =>
  isDemoMissionId(mission.id)
    ? DEMO_INSTRUCTIONS[mission.id]
    : COPY.freshInstruction

export const toMissionPrompt = (mission: Mission) =>
  [
    COPY.promptOpen.replace("{url}", SIDEQUEST_URL),
    instructionFor(mission),
    COPY.promptProtocol,
    COPY.promptSnapshot,
    JSON.stringify(mission, null, 2),
  ].join("\n\n")
