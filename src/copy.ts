import type { DemoMissionId } from "./domain/seed"

export const SIDEQUEST_URL = "https://daymaker.fun"

export const COPY = {
  addRequirement: "Add need",
  addRequirementHint: "Add need and press Enter",
  allowNeedToAdapt: "Allow {need} to adapt",
  agentHint:
    "Paste this into ChatGPT on mobile or desktop. It will open Sidequest in Work, structure Needs, and create the Proposed schedule there.",
  constraintsTitle: "3 · Review and edit needs",
  changesHint:
    "After you edit Needs here, copy the changes back to ChatGPT. You can also describe feedback directly in ChatGPT and open the new plan link it returns.",
  copyChanges: "Copy changes to ChatGPT",
  copyPlanLink: "Copy link",
  contextTitle: "Needs",
  copyPrompt: "Copy to ChatGPT",
  copiedPrompt: "Copied for ChatGPT",
  copiedChanges: "Changes copied for ChatGPT",
  copiedPlanLink: "Link copied",
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
  handoffTitle: "2 · Copy to ChatGPT",
  planningBrief: "1 · Describe your needs",
  planningBriefPlaceholder:
    "Example: I land in Palermo tomorrow morning. Find a rental car, great breakfast and coffee, one nearby sight, parking, and get me to my hotel by 16:00.",
  planningInstruction:
    "Treat the copied planning input as a new plan request. Your only goal is to create the most sensible plan that satisfies the person's Needs as completely as possible. If the snapshot contains needs, treat them as the source of truth; otherwise extract concise Needs from the free-form brief. Infer and set the plan date and starting location from that input. Use the concise primary city or area where most schedule activity happens as currentLocation.label, while keeping its coordinates at the practical route starting point. Choose a short, specific, playful title rather than a generic destination/day label. Treat locked commitments listed in the copied planning input as fixed requirements to recreate in the new proposal, and mark non-negotiable Needs as fixed. After the mandatory context reset below, ask concise clarifying questions only if essential information is still missing; otherwise research suitable places and generate a Proposed schedule. After updating, give the person the exact clickable session link specified below. Then explain, in the required response language, that there are two ways to iterate: edit Needs on Daymaker, choose Copy changes to ChatGPT, and paste the copied prompt back into this chat; or give feedback directly in this chat about what should change, after which you will revise the proposal and return another updated session link. Also say that they can share the link with friends.",
  planIteration: "Iteration {number}",
  promptLanguage:
    "LANGUAGE REQUIREMENT: Use only the primary language of the person's free-form brief or Needs in the planning input for every message you send. Do not follow the language of the surrounding conversation, UI, inferred profile, or locale. Ignore earlier messages when choosing the response language. English planning input requires every message to be in English. Polish planning input requires every message to be in Polish. Use that language for all communication, including questions, progress updates, tool-use narration, and the final response. Do not narrate in one language while writing the plan in another. Keep proper names, source titles, and exact tool-returned values unchanged. Do not translate the exact session link.",
  promptOpen:
    "Open {url}, continue in Work, and use its Site Tools. Do not stop after explaining that Work or Site Tools are required; complete the requested changes on the Sidequest board, not only in chat.",
  promptProtocol:
    "Call get_mission_state as soon as the page opens, before any write. Use the live board only to obtain the current revision. Immediately call update_day_context with the copied planning input, that live revision, and with replacePlan: true, before research, clarification, or progress narration. Do not compare, reconcile, or preserve unrelated content from the live board; replace it even when that board is populated. After each write, use the returned revision for the next write. Every successful read or write returns a sessionUrl containing the complete current board. After the final successful write, end your response with [Open updated Sidequest plan](sessionUrl), replacing sessionUrl with the exact returned URL. Use the URL returned by the final read only when the requested plan was already written in this turn. Do not finish without the clickable link.",
  promptSnapshot: "Planning input at copy time:",
  release: "v0.2.8",
  updated: "updated",
  planTitle: "Proposed schedule",
  scheduleTitle: "Schedule",
  samplePlans: "Sample plans",
  tagline: "Your day changed. Your plan should too.",
  webMcpChecking: "Checking site tools…",
  webMcpConnected: "Site tools connected",
  webMcpError: "Site tools could not connect · manual controls remain available",
  webMcpUnavailable: "Manual mode · open in ChatGPT or enable Chrome WebMCP",
} as const

export const DEMO_OPTIONS = [
  {
    description: "Rental car, breakfast, one sight, parking, and a fixed 16:00 check-in.",
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
