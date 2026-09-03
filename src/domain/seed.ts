import { PERSONAL_MISSION_ID, type Mission } from "./mission"

export const DEMO_MISSION_ID = "palermo-arrival-demo"
export const BLANK_MISSION_TITLE = "Untitled plan"
export const BLANK_LOCATION_LABEL = "Unknown"

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
    brief: "",
    constraints: [],
    currentLocation: { label: BLANK_LOCATION_LABEL, lat: 0, lng: 0 },
    currentTime: now.toISOString(),
    energy: "medium",
    stage: "brief",
  },
  date: localDate(now, timezone),
  events: [],
  id: PERSONAL_MISSION_ID,
  revision: 0,
  schemaVersion: 1,
  stops: [],
  timezone,
  title: BLANK_MISSION_TITLE,
  updatedAt: now.toISOString(),
})

// A generated schedule fixture used by domain and interaction tests. It is not
// part of the sample catalog shown to people.
export const SEED_MISSION: Mission = {
  context: {
    brief:
      "The gravel ride is complete. Replace the steep Biokovo hike with a relaxed swim and a fuel stop. Keep the 18:30 dinner unchanged.",
    constraints: [
      { fixed: false, id: "constraint-car", label: "car available", status: "active" },
      { fixed: false, id: "constraint-dog", label: "dog with us", status: "active" },
      {
        fixed: false,
        id: "constraint-drive",
        label: "max 20 min drive",
        status: "active",
      },
      {
        fixed: true,
        id: "constraint-dinner",
        label: "keep dinner at 18:30",
        status: "active",
      },
    ],
    currentLocation: {
      label: "Baška Voda",
      lat: 43.3569,
      lng: 16.9502,
    },
    currentTime: "2026-08-30T15:10:00+02:00",
    energy: "medium",
    stage: "needs",
  },
  date: "2026-08-30",
  events: [],
  id: "generated-schedule-fixture",
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
  title: "Gravel, Grub & a Dip",
  updatedAt: "2026-09-03T13:23:00.000Z",
}

export const PALERMO_ARRIVAL_MISSION: Mission = {
  context: {
    brief:
      "I land at Palermo Airport tomorrow morning. I want to rent a car at the airport, drive straight to an excellent breakfast and coffee, see something worthwhile nearby, and check in at [Hotel Trinacria](https://www.booking.com/hotel/it/trinacria-palermo1.html) at 16:00. Find practical parking for every stop.",
    constraints: [],
    currentLocation: {
      label: "Palermo Airport",
      lat: 38.1759,
      lng: 13.091,
    },
    currentTime: "2026-09-04T08:00:00+02:00",
    energy: "medium",
    stage: "brief",
  },
  date: "2026-09-04",
  events: [],
  id: "palermo-arrival-demo",
  revision: 0,
  schemaVersion: 1,
  stops: [],
  timezone: "Europe/Rome",
  title: "Palermo arrival",
  updatedAt: "2026-09-03T13:23:00.000Z",
}

export const CROATIA_GRAVEL_MISSION: Mission = {
  context: {
    brief:
      "I am staying at [Grand Hotel Slavia](https://www.booking.com/hotel/hr/slavija-baska-voda.html) in Baška Voda. Tomorrow morning I want a 20 km gravel ride and to finish before 10:00. I will drive no more than one hour. Find a shaded route with some asphalt but no main roads. On the way back I want an excellent restaurant, then a snorkeling beach with an interesting seabed. Include designated parking everywhere and tell me when I will return.",
    constraints: [],
    currentLocation: {
      label: "Grand Hotel Slavia, Baška Voda",
      lat: 43.3565,
      lng: 16.9494,
    },
    currentTime: "2026-09-04T06:30:00+02:00",
    energy: "high",
    stage: "brief",
  },
  date: "2026-09-04",
  events: [],
  id: "croatia-gravel-demo",
  revision: 0,
  schemaVersion: 1,
  stops: [],
  timezone: "Europe/Zagreb",
  title: "South Croatia gravel day",
  updatedAt: "2026-09-03T13:23:00.000Z",
}

export const DEMO_MISSIONS = {
  "palermo-arrival-demo": PALERMO_ARRIVAL_MISSION,
  "croatia-gravel-demo": CROATIA_GRAVEL_MISSION,
} as const satisfies Record<string, Mission>

export type DemoMissionId = keyof typeof DEMO_MISSIONS

export const isDemoMissionId = (value: string): value is DemoMissionId =>
  Object.hasOwn(DEMO_MISSIONS, value)

export const createDemoMission = (id: DemoMissionId = DEMO_MISSION_ID): Mission =>
  structuredClone(DEMO_MISSIONS[id])
