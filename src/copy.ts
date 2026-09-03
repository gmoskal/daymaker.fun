import type { DemoMissionId } from "./domain/seed"

export const COPY = {
  addItem: "Add item",
  addItemHint: "Add item and press Enter",
  addRequirement: "Add requirement",
  addRequirementHint: "Add requirement and press Enter",
  activityAriaLabel: "Activity log",
  activityEmpty: "No changes yet. Human and agent decisions will appear here.",
  activityTitle: "History",
  agentHint: "Paste the copied prompt into ChatGPT to build or update this board with Site Tools.",
  boardTitle: "Board title",
  close: "Close",
  closeMenu: "Close menu",
  constraintsTitle: "Operating constraints",
  contextTitle: "Context",
  copyPrompt: "Copy prompt for ChatGPT",
  copiedPrompt: "Prompt copied",
  currentLocation: "Current position",
  currentTime: "Local time",
  deleteItem: "Delete item",
  deleteItemConfirm: "Delete this item?",
  demoPrompt:
    "Open https://sidequest-webmcp-eta.vercel.app and use its Site Tools. We are in Baška Voda and our day changed. Read the current Sidequest mission. The gravel ride is complete, we are low on energy, and the Biokovo hike is no longer a good fit. Use reliable sources to find a relaxed swim stop and a fuel stop within our constraints. Keep our 18:30 dinner unchanged. Make the required updates on the Sidequest board, not just in the chat.",
  done: "Mark done",
  editItemTitle: "Edit item title",
  editRequirement: "Edit requirement",
  energy: "Group energy",
  emptyPlanHint:
    "Start with + or load the demo. Drag any unlocked item to reorder it; use the chevron for done, skip, lock, or delete. Route opens the whole plan in Google Maps. ChatGPT can read and update the same plan through Site Tools.",
  freshPrompt:
    "Open https://sidequest-webmcp-eta.vercel.app and use its Site Tools. Read the current Sidequest board. This is a new plan. Ask me for the goal, current location, available time, energy, and any hard constraints that are missing. Research reliable options when needed, then create a practical ordered plan on the Sidequest board. Keep locked items unchanged. Update the board with the available tools, not just in the chat.",
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
  newPlanConfirm: "Replace the current plan with a blank one?",
  newRequirement: "New requirement",
  noMapItems: "No locations to show.",
  openMenu: "Open menu",
  openInAppleMaps: "Open in Apple Maps",
  openInGoogleMaps: "Open in Google Maps",
  openPlanInGoogleMaps: "Open full plan in Google Maps",
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

export const DEMO_PROMPTS = {
  "baska-voda-demo": COPY.demoPrompt,
  "san-francisco-demo":
    "Open https://sidequest-webmcp-eta.vercel.app and use its Site Tools. Read the San Francisco Errands mission. The camera pickup moved to 16:00 and my energy is now low. Reorder the remaining errands around their real opening windows, add one quiet lunch stop if it fits, and keep the 19:00 dinner unchanged. Update the Sidequest board with the available tools, not just in the chat.",
  "barcelona-demo":
    "Open https://sidequest-webmcp-eta.vercel.app and use its Site Tools. Read the Barcelona Swim & Coffee mission. We started late and want to keep only one excellent specialty coffee, a safe serviced beach swim, and the locked 16:00 Picasso ticket. Check reliable current sources, simplify the route, and update the Sidequest board with the available tools, not just in the chat.",
} as const satisfies Record<DemoMissionId, string>
