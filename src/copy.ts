import type { DemoMissionId } from "./domain/seed"

export const SIDEQUEST_URL = "https://sidequest-webmcp-eta.vercel.app"

export const COPY = {
  addItem: "Add item",
  addItemHint: "Add item and press Enter",
  addRequirement: "Add requirement",
  addRequirementHint: "Add requirement and press Enter",
  activityAriaLabel: "Activity log",
  activityEmpty: "No changes yet. Human and agent decisions will appear here.",
  activityTitle: "History",
  agentHint: "Copy the complete board context, then paste it into ChatGPT.",
  boardTitle: "Board title",
  close: "Close",
  closeMenu: "Close menu",
  constraintsTitle: "Operating constraints",
  contextTitle: "Context",
  copyPrompt: "Copy full context for ChatGPT",
  copiedPrompt: "Full context copied",
  currentLocation: "Current position",
  currentTime: "Local time",
  deleteItem: "Delete item",
  deleteItemConfirm: "Delete this item?",
  done: "Mark done",
  editItemTitle: "Edit item title",
  editRequirement: "Edit requirement",
  energy: "Group energy",
  emptyPlanHint:
    "Start with + or load the demo. Drag any unlocked item to reorder it; use the chevron for done, skip, lock, or delete. Route opens the whole plan in Google Maps. ChatGPT can read and update the same plan through Site Tools.",
  freshInstruction:
    "Create a genuinely new plan. Ask me only for the goal, current location, available time, energy, and hard constraints missing from my message. Once you have enough information, call update_day_context with replacePlan: true, a concise title, and the correct IANA timezone. Then research reliable options when needed, add practical stops, and order them on the Sidequest board.",
  googleMapsPreview: "Google Maps preview",
  hideItemActions: "Hide item actions",
  loadDemo: "Load demo",
  loadDemoConfirm: "Replace the current plan with this sample?",
  lock: "Lock",
  locked: "Locked",
  mapCaption: "Preview one item here, or open the whole ordered plan in Google Maps.",
  mapTitle: "Route",
  missionViews: "Mission views",
  newPlan: "New plan",
  newRequirement: "New requirement",
  noMapItems: "No locations to show.",
  openMenu: "Open menu",
  openInAppleMaps: "Open in Apple Maps",
  openInGoogleMaps: "Open in Google Maps",
  openPlanInGoogleMaps: "Open full plan in Google Maps",
  promptOpen:
    "Open {url} and use its Site Tools. Make the requested changes on the Sidequest board, not only in chat.",
  promptProtocol:
    "Call get_mission_state immediately before writing. The JSON below is a snapshot from copy time; if its revision differs from the live tool result, use the live state. After each write, use the returned revision for the next write.",
  promptSnapshot: "Complete Sidequest mission snapshot at copy time:",
  release: "v0.1.1 · updated 3 Sep 2026",
  actionsFor: "Actions for",
  planTitle: "Plan",
  routeItems: "Plan locations",
  scheduleTitle: "Schedule",
  samplePlans: "Sample plans",
  showItemActions: "Show item actions",
  skip: "Skip",
  tagline: "Your day changed. Your plan should too.",
  undo: "Restore",
  unlock: "Unlock",
  unlockToEdit: "Unlock to edit",
  view: "View",
  viewOnMap: "View on map",
  webMcpChecking: "Checking site tools…",
  webMcpConnected: "Site tools connected",
  webMcpError: "Site tools could not connect · manual controls remain available",
  webMcpUnavailable: "Manual mode · open in ChatGPT or enable Chrome WebMCP",
} as const

export const DEMO_OPTIONS = [
  {
    description: "A low-energy coastal plan must change without moving dinner.",
    id: "baska-voda-demo",
    label: "Baška Voda · plan disruption",
  },
  {
    description: "Five errands with opening windows and a fixed evening commitment.",
    id: "san-francisco-demo",
    label: "San Francisco · errands",
  },
  {
    description: "Specialty coffee, a practical swim and one timed museum ticket.",
    id: "barcelona-demo",
    label: "Barcelona · coffee & swim",
  },
] as const satisfies ReadonlyArray<{
  description: string
  id: DemoMissionId
  label: string
}>

export const DEMO_INSTRUCTIONS = {
  "baska-voda-demo":
    "Update this existing plan with replacePlan: false. The gravel ride is complete, the group is low on energy, and the Biokovo hike is no longer a good fit. Use reliable sources to find a relaxed swim stop and a fuel stop within the current constraints. Keep the 18:30 dinner unchanged.",
  "san-francisco-demo":
    "Update this existing plan with replacePlan: false. The camera pickup moved to 16:00 and my energy is now low. Reorder the remaining errands around their real opening windows, add one quiet lunch stop if it fits, and keep the 19:00 dinner unchanged.",
  "barcelona-demo":
    "Update this existing plan with replacePlan: false. We started late and want to keep only one excellent specialty coffee, a safe serviced beach swim, and the locked 16:00 Picasso ticket. Check reliable current sources and simplify the route.",
} as const satisfies Record<DemoMissionId, string>
