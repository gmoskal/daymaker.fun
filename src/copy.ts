import type { DemoMissionId } from "./domain/seed"
import type { EnergyLevel } from "./domain/mission"

export const SIDEQUEST_URL = "https://sidequest-webmcp-eta.vercel.app"

export const COPY = {
  addItem: "Add item",
  addItemHint: "Add item and press Enter",
  addRequirement: "Add need",
  addRequirementHint: "Add need and press Enter",
  activityAriaLabel: "Activity log",
  activityEmpty: "No changes yet. Human and agent decisions will appear here.",
  activityTitle: "History",
  agentHint:
    "Copy these needs into ChatGPT. The agent will research places and write its proposal back to this board through Site Tools.",
  boardTitle: "Board title",
  close: "Close",
  closeMenu: "Close menu",
  constraintsTitle: "Must-haves",
  contextTitle: "Needs",
  copyPrompt: "Copy needs for ChatGPT",
  copiedPrompt: "Needs copied",
  currentLocation: "Current position",
  currentTime: "Local time",
  deleteItem: "Delete item",
  deleteItemConfirm: "Delete this item?",
  done: "Mark done",
  editItemTitle: "Edit item title",
  editRequirement: "Edit need",
  energy: "Preferred pace",
  emptyPlanHint:
    "This proposal is generated from Needs. Copy your needs to ChatGPT to create it. Drag any unlocked item to reorder it. Open the complete proposal in Google Maps or use the map links on each item.",
  hideItemActions: "Hide item actions",
  loadDemo: "Load demo",
  loadDemoConfirm: "Replace the current plan with this sample?",
  lock: "Lock",
  locked: "Locked",
  missionViews: "Mission views",
  newPlan: "New plan",
  newRequirement: "New need",
  fixed: "Fixed",
  flexible: "Flexible",
  removeNeed: "Remove",
  openMenu: "Open menu",
  openInAppleMaps: "Open in Apple Maps",
  openInGoogleMaps: "Open in Google Maps",
  openPlanInGoogleMaps: "Open proposed schedule in Google Maps",
  planningBrief: "What you need",
  planningBriefPlaceholder:
    "Example: I land in Palermo tomorrow morning. Find a rental car, great breakfast and coffee, one nearby sight, parking, and get me to my hotel by 16:00.",
  planningInstruction:
    "Do this on every handoff: turn the free-form brief into the editable Needs list and call update_day_context with those needs, the brief, and replacePlan: true. Preserve locked commitments and mark non-negotiable needs as fixed. Then research suitable places and generate a Proposed schedule on the Sidequest board. Existing unlocked schedule items are replaceable suggestions, not requirements.",
  promptOpen:
    "Open {url} and use its Site Tools. Make the requested changes on the Sidequest board, not only in chat.",
  promptProtocol:
    "Call get_mission_state immediately before writing. The JSON below is a snapshot from copy time; if its revision differs from the live tool result, use the live state. After each write, use the returned revision for the next write.",
  promptSnapshot: "Needs snapshot at copy time:",
  release: "v0.2.0 · updated 3 Sep 2026",
  actionsFor: "Actions for",
  planTitle: "Proposed schedule",
  scheduleTitle: "Schedule",
  samplePlans: "Sample plans",
  showItemActions: "Show item actions",
  skip: "Skip",
  tagline: "Your day changed. Your plan should too.",
  undo: "Restore",
  unlock: "Unlock",
  unlockToEdit: "Unlock to edit",
  view: "View",
  webMcpChecking: "Checking site tools…",
  webMcpConnected: "Site tools connected",
  webMcpError: "Site tools could not connect · manual controls remain available",
  webMcpUnavailable: "Manual mode · open in ChatGPT or enable Chrome WebMCP",
} as const

export const PACE_LABELS = {
  high: "Full",
  low: "Easy",
  medium: "Balanced",
} as const satisfies Record<EnergyLevel, string>

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
