import { PERSONAL_MISSION_ID, type Mission } from "./mission"

export const DEMO_MISSION_ID = "baska-voda-demo"
export const BLANK_MISSION_TITLE = "Untitled plan"
export const BLANK_LOCATION_LABEL = "Set your location"

const localDate = (now: Date, timezone: string) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric",
  }).formatToParts(now)
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "01"
  return `${value("year")}-${value("month")}-${value("day")}`
}

export const createBlankMission = (
  now = new Date(),
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
): Mission => ({
  context: {
    constraints: [],
    currentLocation: { label: BLANK_LOCATION_LABEL, lat: 0, lng: 0 },
    currentTime: now.toISOString(),
    energy: "medium",
  },
  date: localDate(now, timezone),
  events: [],
  id: PERSONAL_MISSION_ID,
  revision: 0,
  schemaVersion: 1,
  stops: [],
  timezone,
  title: BLANK_MISSION_TITLE,
})

export const SEED_MISSION: Mission = {
  context: {
    constraints: [
      { id: "constraint-car", label: "car available", status: "active" },
      { id: "constraint-dog", label: "dog with us", status: "active" },
      {
        id: "constraint-drive",
        label: "max 20 min drive",
        status: "active",
      },
      {
        id: "constraint-dinner",
        label: "keep dinner at 18:30",
        status: "active",
      },
    ],
    currentLocation: {
      label: "Bike parking, Baška Voda",
      lat: 43.3569,
      lng: 16.9502,
    },
    currentTime: "2026-08-30T15:10:00+02:00",
    energy: "medium",
  },
  date: "2026-08-30",
  events: [],
  id: DEMO_MISSION_ID,
  revision: 6,
  schemaVersion: 1,
  stops: [
    {
      durationMinutes: 210,
      id: "gravel-loop",
      kind: "activity",
      location: {
        label: "Bike parking, Baška Voda",
        lat: 43.3569,
        lng: 16.9502,
      },
      locked: false,
      rationale: "A shaded gravel loop above the coast to start the adventure.",
      startsAt: "2026-08-30T11:30:00+02:00",
      status: "active",
      title: "Forest gravel loop",
      travelMinutesFromPrevious: 0,
    },
    {
      durationMinutes: 90,
      id: "biokovo-hike",
      kind: "activity",
      location: {
        label: "Biokovo trailhead",
        lat: 43.3407,
        lng: 17.061,
      },
      locked: false,
      rationale: "A steep sunset hike if the group still has energy.",
      startsAt: "2026-08-30T15:30:00+02:00",
      status: "planned",
      title: "Biokovo sunset hike",
      travelMinutesFromPrevious: 35,
    },
    {
      durationMinutes: 45,
      id: "return-shower",
      kind: "transition",
      location: {
        label: "Baška Voda apartment",
        lat: 43.3578,
        lng: 16.9491,
      },
      locked: false,
      rationale: "Reset before the evening reservation.",
      startsAt: "2026-08-30T17:15:00+02:00",
      status: "planned",
      title: "Return & shower",
      travelMinutesFromPrevious: 25,
    },
    {
      durationMinutes: 90,
      id: "dinner",
      kind: "meal",
      location: {
        label: "Baška Voda old town",
        lat: 43.3573,
        lng: 16.9507,
      },
      locked: true,
      note: "Reservation for 18:30",
      rationale: "The one commitment the rest of the day must protect.",
      startsAt: "2026-08-30T18:30:00+02:00",
      status: "planned",
      title: "Dinner reservation",
      travelMinutesFromPrevious: 5,
    },
  ],
  timezone: "Europe/Zagreb",
  title: "Baška Voda Adventure",
}

export const SAN_FRANCISCO_MISSION: Mission = {
  context: {
    constraints: [
      { id: "sf-constraint-parcel", label: "ship fragile return first", status: "active" },
      { id: "sf-constraint-market", label: "Ferry Plaza market closes at 14:00", status: "active" },
      { id: "sf-constraint-camera", label: "camera pickup only after 12:00", status: "active" },
      { id: "sf-constraint-transit", label: "walk or use Muni", status: "active" },
      { id: "sf-constraint-dinner", label: "keep dinner at 19:00", status: "active" },
    ],
    currentLocation: {
      label: "Embarcadero Station, San Francisco",
      lat: 37.7929,
      lng: -122.3971,
    },
    currentTime: "2026-09-03T09:20:00-07:00",
    energy: "medium",
  },
  date: "2026-09-03",
  events: [],
  id: "san-francisco-demo",
  revision: 5,
  schemaVersion: 1,
  stops: [
    {
      durationMinutes: 25,
      id: "sf-usps-return",
      kind: "service",
      location: {
        label: "Rincon Finance Center USPS, 180 Steuart St",
        lat: 37.7922,
        lng: -122.3935,
      },
      locked: false,
      rationale: "Clear the fragile parcel before carrying anything else across town.",
      source: {
        checkedAt: "2026-09-03T09:10:00-07:00",
        title: "USPS · Rincon Finance Center",
        url: "https://tools.usps.com/locations/details/1440865",
      },
      startsAt: "2026-09-03T09:30:00-07:00",
      status: "active",
      title: "Ship return · USPS Rincon",
      travelMinutesFromPrevious: 6,
    },
    {
      durationMinutes: 40,
      id: "sf-ferry-market",
      kind: "service",
      location: {
        label: "Ferry Plaza Farmers Market",
        lat: 37.7955,
        lng: -122.3937,
      },
      locked: false,
      rationale: "Buy the dinner ingredients while the Thursday market is open.",
      source: {
        checkedAt: "2026-09-03T09:12:00-07:00",
        title: "Foodwise · Ferry Plaza Farmers Market",
        url: "https://foodwise.org/markets/ferry-plaza-farmers-market/visitor-info/",
      },
      startsAt: "2026-09-03T10:10:00-07:00",
      status: "planned",
      title: "Groceries · Ferry Plaza",
      travelMinutesFromPrevious: 5,
    },
    {
      durationMinutes: 25,
      id: "sf-library-return",
      kind: "service",
      location: {
        label: "San Francisco Main Library, 100 Larkin St",
        lat: 37.7789,
        lng: -122.4158,
      },
      locked: false,
      rationale: "Return the due books before crossing to the camera shop.",
      source: {
        checkedAt: "2026-09-03T09:13:00-07:00",
        title: "SFPL · Main Library",
        url: "https://sfpl.org/locations/main-library",
      },
      startsAt: "2026-09-03T11:15:00-07:00",
      status: "planned",
      title: "Return books · Main Library",
      travelMinutesFromPrevious: 24,
    },
    {
      durationMinutes: 30,
      id: "sf-camera-pickup",
      kind: "service",
      location: {
        label: "Glass Key Photo, 1230 Sutter St",
        lat: 37.7878,
        lng: -122.4207,
      },
      locked: false,
      note: "Pickup window starts at noon",
      rationale: "The shop opens at noon, so this stop cannot be pulled earlier.",
      source: {
        checkedAt: "2026-09-03T09:14:00-07:00",
        title: "Glass Key Photo · Store details",
        url: "https://www.glasskeyphoto.com/glass-key-photo",
      },
      startsAt: "2026-09-03T12:15:00-07:00",
      status: "planned",
      title: "Collect repaired camera",
      travelMinutesFromPrevious: 18,
    },
    {
      durationMinutes: 90,
      id: "sf-dinner",
      kind: "meal",
      location: {
        label: "Dinner reservation, Hayes Valley",
        lat: 37.7765,
        lng: -122.4247,
      },
      locked: true,
      note: "Reservation for 19:00",
      rationale: "The fixed evening commitment that every replanning pass must protect.",
      startsAt: "2026-09-03T19:00:00-07:00",
      status: "planned",
      title: "Dinner reservation",
      travelMinutesFromPrevious: 16,
    },
  ],
  timezone: "America/Los_Angeles",
  title: "San Francisco Errands",
}

export const BARCELONA_MISSION: Mission = {
  context: {
    constraints: [
      { id: "bcn-constraint-coffee", label: "one excellent specialty coffee", status: "active" },
      { id: "bcn-constraint-swim", label: "swim before midday heat", status: "active" },
      { id: "bcn-constraint-transit", label: "metro and walking only", status: "active" },
      { id: "bcn-constraint-museum", label: "keep Picasso entry at 16:00", status: "active" },
      { id: "bcn-constraint-pace", label: "leave recovery time after the beach", status: "active" },
    ],
    currentLocation: {
      label: "Poblenou, Barcelona",
      lat: 41.3992,
      lng: 2.2049,
    },
    currentTime: "2026-09-05T08:45:00+02:00",
    energy: "high",
  },
  date: "2026-09-05",
  events: [],
  id: "barcelona-demo",
  revision: 5,
  schemaVersion: 1,
  stops: [
    {
      durationMinutes: 55,
      id: "bcn-nomad-coffee",
      kind: "meal",
      location: {
        label: "NOMAD Frutas Selectas, Carrer de Pujades 95",
        lat: 41.3986,
        lng: 2.1997,
      },
      locked: false,
      rationale: "Start with a respected local roaster a short walk from the beach route.",
      source: {
        checkedAt: "2026-09-03T08:20:00+02:00",
        title: "NOMAD · Barcelona locations",
        url: "https://nomadcoffee.es/pages/contact",
      },
      startsAt: "2026-09-05T09:00:00+02:00",
      status: "active",
      title: "NOMAD specialty coffee",
      travelMinutesFromPrevious: 8,
    },
    {
      durationMinutes: 85,
      id: "bcn-bogatell-swim",
      kind: "activity",
      location: {
        label: "Bogatell Beach, Barcelona",
        lat: 41.3942,
        lng: 2.2108,
      },
      locked: false,
      note: "Lifeguards, showers and accessible facilities are listed in season",
      rationale: "A practical city swim with listed services before the strongest heat.",
      source: {
        checkedAt: "2026-09-03T08:22:00+02:00",
        title: "Barcelona Tourism · Bogatell Beach",
        url: "https://bid.barcelonaturisme.com/wv3/en/page/1270/bogatell-beach.html",
      },
      startsAt: "2026-09-05T10:30:00+02:00",
      status: "planned",
      title: "Swim · Bogatell Beach",
      travelMinutesFromPrevious: 14,
    },
    {
      durationMinutes: 75,
      id: "bcn-poblenou-lunch",
      kind: "meal",
      location: {
        label: "Rambla del Poblenou, Barcelona",
        lat: 41.4007,
        lng: 2.202,
      },
      locked: false,
      rationale: "Dry off, eat nearby and keep a generous buffer before the timed ticket.",
      startsAt: "2026-09-05T12:30:00+02:00",
      status: "planned",
      title: "Lunch & reset · Poblenou",
      travelMinutesFromPrevious: 16,
    },
    {
      durationMinutes: 110,
      id: "bcn-picasso",
      kind: "activity",
      location: {
        label: "Museu Picasso Barcelona",
        lat: 41.3853,
        lng: 2.1809,
      },
      locked: true,
      note: "Timed entry at 16:00",
      rationale: "The prepaid booking is the fixed anchor for the afternoon.",
      source: {
        checkedAt: "2026-09-03T08:24:00+02:00",
        title: "Museu Picasso Barcelona",
        url: "https://museupicassobcn.cat/en",
      },
      startsAt: "2026-09-05T16:00:00+02:00",
      status: "planned",
      title: "Picasso Museum · timed entry",
      travelMinutesFromPrevious: 28,
    },
    {
      durationMinutes: 60,
      id: "bcn-sunset-walk",
      kind: "activity",
      location: {
        label: "Port Vell, Barcelona",
        lat: 41.3765,
        lng: 2.1842,
      },
      locked: false,
      rationale: "Finish with an easy waterfront walk rather than another high-effort stop.",
      startsAt: "2026-09-05T18:30:00+02:00",
      status: "planned",
      title: "Golden-hour walk · Port Vell",
      travelMinutesFromPrevious: 18,
    },
  ],
  timezone: "Europe/Madrid",
  title: "Barcelona Swim & Coffee",
}

export const DEMO_MISSIONS = {
  [DEMO_MISSION_ID]: SEED_MISSION,
  "barcelona-demo": BARCELONA_MISSION,
  "san-francisco-demo": SAN_FRANCISCO_MISSION,
} as const satisfies Record<string, Mission>

export type DemoMissionId = keyof typeof DEMO_MISSIONS

export const isDemoMissionId = (value: string): value is DemoMissionId =>
  Object.hasOwn(DEMO_MISSIONS, value)

export const createDemoMission = (id: DemoMissionId = DEMO_MISSION_ID): Mission =>
  structuredClone(DEMO_MISSIONS[id])
