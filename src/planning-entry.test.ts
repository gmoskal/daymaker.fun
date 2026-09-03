import { describe, expect, it, vi } from "vitest"

import { MISSION_STORAGE_KEY, type StoragePort } from "./store"
import { consumeNewPlanEntry, newPlanEntryUrl } from "./planning-entry"

const storage = (removeItem = vi.fn()): StoragePort => ({
  getItem: () => null,
  removeItem,
  setItem: () => undefined,
})

describe("new plan entry", () => {
  it("creates a one-shot planning URL", () => {
    expect(newPlanEntryUrl("https://daymaker.fun")).toBe(
      "https://daymaker.fun/needs?new=1",
    )
  })

  it("clears the browser-local board and consumes the marker", () => {
    const removeItem = vi.fn()

    expect(
      consumeNewPlanEntry({
        source: "https://daymaker.fun/needs?new=1",
        storage: storage(removeItem),
      }),
    ).toBe("/needs")
    expect(removeItem).toHaveBeenCalledExactlyOnceWith(MISSION_STORAGE_KEY)
  })

  it("leaves ordinary visits unchanged", () => {
    const removeItem = vi.fn()

    expect(
      consumeNewPlanEntry({
        source: "https://daymaker.fun/needs",
        storage: storage(removeItem),
      }),
    ).toBeNull()
    expect(removeItem).not.toHaveBeenCalled()
  })
})
