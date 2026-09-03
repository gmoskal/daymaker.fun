import type { DemoMissionId } from "./domain/seed"
import { PRODUCT_NAME } from "./product"

export const COPY = {
  about: "About",
  aboutBack: "Back to Needs",
  aboutIntro:
    `${PRODUCT_NAME} turns a short description of what you need into an editable brief and a researched, read-only schedule.`,
  aboutPrivacy:
    "Each tab owns its board in memory. A share link contains the complete portable snapshot, so anyone with that link can open an independent copy without an account or backend.",
  aboutStepBrief:
    `Describe the outcome, timing, places, and constraints that matter. ${PRODUCT_NAME} can turn that text into editable Needs.`,
  aboutStepHandoff:
    "Choose Quick, Normal, or Deep research, copy the prompt, and paste it into ChatGPT on mobile or desktop.",
  aboutStepPlan:
    `ChatGPT opens a fresh ${PRODUCT_NAME} board for the first plan, researches the options, and returns a link to the Proposed schedule.`,
  aboutStepRevise:
    "Edit Needs and copy the delta back, or give feedback directly in chat. Matching sessions keep unaffected plan items and each revision returns a new shareable link.",
  aboutTitle: `How ${PRODUCT_NAME} works`,
  addRequirement: "Add need",
  addRequirementHint: "Add need and press Enter",
  allowNeedToAdapt: "Allow {need} to adapt",
  agentHint:
    `Paste this into ChatGPT on mobile or desktop. It will open ${PRODUCT_NAME} in Work, structure Needs, and create the Proposed schedule there.`,
  constraintsTitle: "Review and edit needs",
  changesHint:
    "After you edit Needs here, copy the changes back to ChatGPT. You can also describe feedback directly in ChatGPT and open the new plan link it returns.",
  copyChanges: "Copy changes to ChatGPT",
  copySessionLink: "Copy link to share",
  contextTitle: "Needs",
  copyPrompt: "Copy to ChatGPT",
  copiedPrompt: "Copied for ChatGPT",
  copiedChanges: "Changes copied for ChatGPT",
  copiedSessionLink: "Link copied",
  editRequirement: "Edit need",
  emptyPlanHint:
    "This proposal is generated from Needs. Copy your needs to ChatGPT to create it. When it is ready, open items for details and maps. Open the complete proposal in Google Maps when you want the whole route.",
  loadDemo: "Load demo",
  loadDemoConfirm: "Replace the current plan with this sample?",
  missionViews: "Mission views",
  makeNeedNonNegotiable: "Make {need} non-negotiable",
  newPlan: "New plan",
  newRequirement: "New need",
  mustKeep: "Must keep",
  canAdapt: "Can adapt",
  removeNeed: "Remove",
  openInAppleMaps: "Open in Apple Maps",
  openInGoogleMaps: "Open in Google Maps",
  openPlanInGoogleMaps: "Open proposed schedule in Google Maps",
  effortTitle: "2 · Choose effort",
  handoffTitle: "3 · Copy to ChatGPT",
  planningBrief: "1 · Describe your needs",
  planningBriefPlaceholder:
    "Example: Start tomorrow's route at Palermo Airport. Include a rental car, excellent breakfast and coffee, one nearby sight, parking, and a fixed 16:00 arrival at Hotel Trinacria.",
  planningInstruction:
    `When sampleData is true, its places, links, and times are a fictional product demo rather than the person's private travel data. Your only goal is to create the most sensible plan that satisfies the person's current Needs as completely as possible. Treat needs in the snapshot as the source of truth; when they are absent, extract concise Needs from the free-form brief. Infer and set the plan date and practical starting location from the input. Use the concise primary city or area where most schedule activity happens as currentLocation.label. Choose a short, specific, playful title rather than a generic destination/day label. Mark non-negotiable Needs as fixed. Ask one concise clarifying question only when an essential fact is missing; otherwise complete the work without intermediate progress narration. Follow the selected effort contract below. After updating, give the person the exact clickable session link specified below. Then explain, in the required response language, that there are two ways to iterate: edit Needs on ${PRODUCT_NAME}, choose Copy changes to ChatGPT, and paste the copied prompt back into this chat; or give feedback directly in this chat, after which you will revise the proposal and return another updated session link. Also say that they can share the link with friends.`,
  promptCreateInstruction:
    "HANDOFF MODE: NEW SESSION. Start this request from scratch. Do not inspect, reconcile, or preserve any unrelated board that may already exist in the browser.",
  promptUpdateInstruction:
    "HANDOFF MODE: UPDATE THIS SESSION. The portable URL contains the exact existing session, its current Needs, and its Proposed schedule. The Needs already include the person's edits. Apply only those edits and the selected effort change: preserve unaffected stops, stable stop IDs, sources, and decisions. Do not clear the board, rebuild the whole schedule, or repeat research for unaffected choices.",
  planIteration: "Iteration {number}",
  promptLanguage:
    "LANGUAGE REQUIREMENT: Use only the primary language of the person's free-form brief or Needs in the planning input for every message you send. Do not follow the language of the surrounding conversation, UI, inferred profile, or locale. Ignore earlier messages when choosing the response language. English planning input requires every message to be in English. Polish planning input requires every message to be in Polish. Use that language for all communication, including questions, progress updates, tool-use narration, and the final response. Do not narrate in one language while writing the plan in another. Keep proper names, source titles, and exact tool-returned values unchanged. Do not translate the exact session link.",
  promptOpen:
    `Open {url}, continue in Work, and use its Site Tools. Do not stop after explaining that Work or Site Tools are required; complete the requested changes on the ${PRODUCT_NAME} board, not only in chat.`,
  promptCreateProtocol:
    "The one-shot URL clears any previous browser-local board before Site Tools register. Call get_mission_state immediately, then call update_day_context with the copied planning input, the returned revision, and replacePlan: true. Generate the complete Proposed schedule from the resulting Needs.",
  promptUpdateProtocol:
    "Call get_mission_state immediately and compare its mission.id with missionId in the copied planning input. When they match, this is the same session: call update_day_context once with the current copied context and Needs, the latest revision, and replacePlan: false, then use needsDelta to update only affected schedule stops. Set obsolete or replaced stops to removed through update_mission_stop, add only necessary new or replacement stops, and reorder only the active/planned stops when timing changes. Preserve every unaffected stop. When the IDs do not match, do not mutate the unrelated board: open {newPlanUrl}, read its blank state, initialize it with update_day_context and replacePlan: true, and build a fresh proposal from the copied current Needs.",
  promptResultProtocol:
    `After each write, use the returned revision for the next write. Every successful read or write returns a sessionUrl containing the complete current board. After the final successful write, end your response with [Open updated ${PRODUCT_NAME} plan](sessionUrl), replacing sessionUrl with the exact URL returned by the final write. Use a URL returned by a final read only when the requested plan was already fully written in this turn. Do not finish without the clickable link.`,
  promptSnapshot: "Planning input at copy time:",
  release: "v0.4.0",
  researchDepth: "Effort",
  researchDepthAriaLabel: "Planning effort",
  updated: "updated",
  planTitle: "Proposed schedule",
  scheduleTitle: "Schedule",
  samplePlans: "Sample plans",
  setResearchDepth: "Set planning effort to {level}",
  tagline: "Your day changed. Your plan should too.",
  webMcpChecking: "Checking site tools…",
  webMcpConnected: "Site tools connected",
  webMcpError: "Site tools could not connect · manual controls remain available",
  webMcpUnavailable: "Manual mode · open in ChatGPT or enable Chrome WebMCP",
} as const

export const DEMO_OPTIONS = [
  {
    description: "Airport car rental, breakfast, one sight, parking, and a fixed hotel arrival.",
    id: "palermo-arrival-demo",
    label: "Palermo arrival",
  },
  {
    description: "A 20 km shaded gravel ride, lunch, snorkeling, and parking.",
    id: "croatia-gravel-demo",
    label: "South Croatia gravel day",
  },
] as const satisfies ReadonlyArray<{
  description: string
  id: DemoMissionId
  label: string
}>
