import { describe, expect, it } from "vitest"

import {
  type Mission,
  type MissionAction,
  type MissionMutation,
} from "./mission"
import { applyMissionAction, futureStops } from "./mission-transition"
import { SEED_MISSION } from "./seed"

const nextId = () => "test-id"
const mission = (fields: Partial<Mission> = {}): Mission => ({
  ...structuredClone(SEED_MISSION),
  ...fields,
})
const apply = (
  action: MissionAction,
  value: Mission = mission(),
): MissionMutation => applyMissionAction({ action, id: nextId, mission: value })
const expectApplied = (mutation: MissionMutation) => {
  expect(mutation.type).toBe("applied")
  if (mutation.type !== "applied") throw new Error("Expected an applied mutation")
  return mutation.value
}
const expectRejected = (mutation: MissionMutation, code: string) => {
  expect(mutation.type).toBe("rejected")
  if (mutation.type !== "rejected") throw new Error("Expected a rejected mutation")
  expect(mutation.value.code).toBe(code)
  return mutation.value
}
const stopAction = (
  fields: Record<string, unknown> = {},
): MissionAction => ({
  type: "UpdateStop",
  value: {
    actor: "human",
    input: {
      expectedRevision: SEED_MISSION.revision,
      reason: "The gravel ride is complete.",
      status: "completed",
      stopId: "gravel-loop",
      ...fields,
    },
  },
}) as MissionAction

describe("mission", () => {
  it("applies a valid action through the single transition gate", () => {
    const value = expectApplied(apply(stopAction()))

    expect(value.mission.revision).toBe(7)
    expect(value.mission.events[0]).toMatchObject({
      actor: "human",
      type: "stop_updated",
    })
    expect(
      value.mission.stops.find((stop) => stop.id === "gravel-loop"),
    ).toMatchObject({ status: "completed" })
  })

  it("rejects a stale action without changing the original mission", () => {
    const original = mission()
    const error = expectRejected(
      apply(stopAction({ expectedRevision: 5 }), original),
      "STALE_REVISION",
    )

    expect(error).toMatchObject({ retryable: true, revision: 6 })
    expect(original).toEqual(SEED_MISSION)
  })

  it("rejects status changes to the locked dinner", () => {
    expectRejected(
      apply(stopAction({ status: "skipped", stopId: "dinner" })),
      "LOCKED_STOP",
    )
  })

  it("lets the human control a stop lock", () => {
    const locked = expectApplied(
      apply({
        type: "SetStopLock",
        value: {
          actor: "human",
          input: {
            expectedRevision: 6,
            locked: true,
            stopId: "biokovo-hike",
          },
        },
      }),
    ).mission

    expect(locked.stops.find((stop) => stop.id === "biokovo-hike")).toMatchObject({
      locked: true,
    })
    expectRejected(
      apply(
        {
          type: "SetStopLock",
          value: {
            actor: "agent",
            input: {
              expectedRevision: 7,
              locked: false,
              stopId: "biokovo-hike",
            },
          },
        },
        locked,
      ),
      "FORBIDDEN_ACTION",
    )
  })

  it("lets a person delete an item through the transition gate", () => {
    const value = expectApplied(
      apply({
        type: "RemoveStop",
        value: {
          actor: "human",
          input: { expectedRevision: 6, stopId: "biokovo-hike" },
        },
      } as unknown as MissionAction),
    )

    expect(value.mission.stops.map((stop) => stop.id)).not.toContain(
      "biokovo-hike",
    )
    expect(value.mission.events[0]).toMatchObject({
      actor: "human",
      type: "stop_removed",
    })
  })

  it("edits an ordered constraint checklist", () => {
    const added = expectApplied(
      apply({
        type: "AddConstraint",
        value: {
          actor: "human",
          input: { expectedRevision: 6, label: "avoid steep climbs" },
        },
      }),
    ).mission
    const newConstraint = added.context.constraints.at(-1)
    if (newConstraint === undefined) throw new Error("Expected added constraint")

    const crossed = expectApplied(
      apply(
        {
          type: "ToggleConstraint",
          value: {
            actor: "human",
            input: {
              constraintId: newConstraint.id,
              expectedRevision: 7,
            },
          },
        },
        added,
      ),
    ).mission
    const reordered = expectApplied(
      apply(
        {
          type: "ReorderConstraints",
          value: {
            actor: "human",
            input: {
              expectedRevision: 8,
              orderedConstraintIds: [
                newConstraint.id,
                ...crossed.context.constraints
                  .filter((constraint) => constraint.id !== newConstraint.id)
                  .map((constraint) => constraint.id),
              ],
            },
          },
        },
        crossed,
      ),
    ).mission

    expect(reordered.context.constraints[0]).toMatchObject({
      id: newConstraint.id,
      label: "avoid steep climbs",
      status: "crossed",
    })
  })

  it("validates raw input at the domain boundary", () => {
    expectRejected(apply(stopAction({ status: "removed" })), "INVALID_INPUT")
  })

  it("adds a source-backed stop with a generated unique id", () => {
    const value = expectApplied(
      apply({
        type: "AddStop",
        value: {
          actor: "agent",
          input: {
            durationMinutes: 70,
            expectedRevision: 6,
            kind: "activity",
            location: {
              label: "Punta Rata, Brela",
              lat: 43.370062,
              lng: 16.922775,
            },
            rationale: "Low-effort water time before dinner.",
            source: {
              checkedAt: "2026-08-30T15:11:00+02:00",
              title: "Punta Rata — TZ Brela",
              url: "https://brela.hr/en/beaches/the-punta-rata-beach",
            },
            startsAt: "2026-08-30T15:30:00+02:00",
            title: "Punta Rata swim & snorkel",
            travelMinutesFromPrevious: 12,
          },
        },
      }),
    )
    const added = value.mission.stops.at(-1)

    expect(added).toMatchObject({
      id: "punta-rata-swim-snorkel-test-id",
      locked: false,
      status: "planned",
    })
    expect(value.change.stopId).toBe(added?.id)
  })

  it("rejects a non-HTTPS source and the eight-stop limit", () => {
    const addAction: MissionAction = {
      type: "AddStop",
      value: {
        actor: "agent",
        input: {
          durationMinutes: 10,
          expectedRevision: 6,
          kind: "service",
          location: { label: "Fuel", lat: 43.3, lng: 17 },
          rationale: "Fuel before dinner.",
          source: {
            checkedAt: "2026-08-30T15:12:00+02:00",
            title: "Fuel source",
            url: "http://example.com",
          },
          startsAt: "2026-08-30T17:05:00+02:00",
          title: "Fuel stop",
          travelMinutesFromPrevious: 20,
        },
      },
    }

    expectRejected(apply(addAction), "INVALID_INPUT")

    const fullMission = mission({
      stops: [
        ...SEED_MISSION.stops,
        ...SEED_MISSION.stops.map((stop, index) => ({
          ...stop,
          id: `extra-${index}`,
          locked: false,
        })),
      ],
    })
    const validAction: MissionAction = {
      ...addAction,
      value: {
        ...addAction.value,
        input: {
          ...addAction.value.input,
          source: { ...addAction.value.input.source, url: "https://example.com" },
        },
      },
    }

    expectRejected(apply(validAction, fullMission), "LIMIT_REACHED")
  })

  it("reorders every future stop once and preserves locked time", () => {
    const value = expectApplied(
      apply({
        type: "ReorderStops",
        value: {
          actor: "agent",
          input: {
            expectedRevision: 6,
            orderedStops: [
              { startsAt: "2026-08-30T16:00:00+02:00", stopId: "biokovo-hike" },
              { startsAt: "2026-08-30T17:35:00+02:00", stopId: "return-shower" },
              { startsAt: "2026-08-30T18:30:00+02:00", stopId: "dinner" },
              { startsAt: "2026-08-30T15:30:00+02:00", stopId: "gravel-loop" },
            ],
            reason: "Fit the remaining mission around dinner.",
          },
        },
      }),
    )

    expect(futureStops(value.mission).map((stop) => stop.id)).toEqual([
      "biokovo-hike",
      "return-shower",
      "dinner",
      "gravel-loop",
    ])
    expect(value.mission.stops.find((stop) => stop.id === "dinner")?.startsAt).toBe(
      "2026-08-30T18:30:00+02:00",
    )
  })

  it.each([
    {
      name: "misses a future stop",
      stops: [
        { startsAt: "2026-08-30T15:30:00+02:00", stopId: "gravel-loop" },
      ],
    },
    {
      name: "duplicates a future stop",
      stops: [
        { startsAt: "2026-08-30T15:30:00+02:00", stopId: "gravel-loop" },
        { startsAt: "2026-08-30T15:40:00+02:00", stopId: "gravel-loop" },
        { startsAt: "2026-08-30T16:00:00+02:00", stopId: "biokovo-hike" },
        { startsAt: "2026-08-30T17:35:00+02:00", stopId: "return-shower" },
        { startsAt: "2026-08-30T18:30:00+02:00", stopId: "dinner" },
      ],
    },
    {
      name: "moves the locked dinner",
      stops: [
        { startsAt: "2026-08-30T15:30:00+02:00", stopId: "gravel-loop" },
        { startsAt: "2026-08-30T16:00:00+02:00", stopId: "biokovo-hike" },
        { startsAt: "2026-08-30T17:35:00+02:00", stopId: "return-shower" },
        { startsAt: "2026-08-30T18:45:00+02:00", stopId: "dinner" },
      ],
    },
  ])("rejects an order that $name", ({ stops }) => {
    expectRejected(
      apply({
        type: "ReorderStops",
        value: {
          actor: "agent",
          input: {
            expectedRevision: 6,
            orderedStops: stops,
            reason: "Invalid test order.",
          },
        },
      }),
      "INVALID_ORDER",
    )
  })
})
