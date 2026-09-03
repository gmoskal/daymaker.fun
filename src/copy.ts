import type { DemoMissionId } from "./domain/seed"

export const SIDEQUEST_URL = "https://sidequest-webmcp-eta.vercel.app"

export const COPY = {
  addRequirement: "Add need",
  addRequirementHint: "Add need and press Enter",
  allowNeedToAdapt: "Allow {need} to adapt",
  agentHint:
    "Paste this into ChatGPT on mobile or desktop. It will open Sidequest in Work, structure Needs, and create the Proposed schedule there.",
  constraintsTitle: "3 · Review and edit needs",
  changesHint:
    "After you edit Needs on the opened board, copy the changes to ChatGPT to update the Proposed schedule. Changes made through that board's Site Tools appear there directly.",
  copyChanges: "Copy changes to ChatGPT",
  copySessionLink: "Copy session link",
  contextTitle: "Needs",
  copyPrompt: "Copy to ChatGPT",
  copiedPrompt: "Copied for ChatGPT",
  copiedChanges: "Changes copied for ChatGPT",
  copiedSessionLink: "Session link copied",
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
    "Your only goal is to create the most sensible plan that satisfies the person's Needs as completely as possible. If essential information is missing, ask concise clarifying questions before writing. Otherwise, if the snapshot contains needs, treat them as the current user-edited source of truth; if it does not, extract concise Needs from the free-form brief. Infer and set the plan date and starting location from the request. Use the concise primary city or area where most schedule activity happens as currentLocation.label, while keeping its coordinates at the practical route starting point. Choose a short, specific, playful title for the generated plan rather than a generic destination/day label. Call update_day_context with needs, the retained brief, and replacePlan: true. Preserve locked commitments and mark non-negotiable needs as fixed. Research suitable places, then generate a Proposed schedule on the Sidequest board. Existing unlocked schedule items are replaceable suggestions, not requirements. After updating, give the person the exact clickable session link specified below and say they can edit Needs there for another iteration.",
  promptOpen:
    "Open {url}, continue in Work, and use its Site Tools. Do not stop after explaining that Work or Site Tools are required; complete the requested changes on the Sidequest board, not only in chat.",
  promptProtocol:
    "Call get_mission_state as soon as the page opens, before any write. The JSON below is the copied planning input. If the live board is blank, bootstrap it from the copied planning input using the live revision. Do not discard the copied brief just because its revision differs from a newly opened browser. If the live board already contains work for this request, preserve its current Needs and locked commitments. After each write, use the returned revision for the next write. Every successful read or write returns a sessionUrl containing the complete current board. After the final successful write, end your response with [Open updated Sidequest plan](sessionUrl), replacing sessionUrl with the exact returned URL. If no write was needed, use the URL returned by the final read. Do not finish without the clickable link.",
  promptSnapshot: "Planning input at copy time:",
  release: "v0.2.4",
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
