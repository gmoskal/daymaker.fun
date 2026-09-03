import { describe, expect, it } from "vitest"

import {
  DEFAULT_RESEARCH_DEPTH,
  RESEARCH_DEPTH_STORAGE_KEY,
  RESEARCH_DEPTHS,
  loadResearchDepth,
  researchDepthAt,
  researchInstructionFor,
  saveResearchDepth,
} from "./research-depth"

describe("research depth", () => {
  it("offers exactly three ordered levels with Normal as the default", () => {
    expect(RESEARCH_DEPTHS.map(({ id, label }) => ({ id, label }))).toEqual([
      { id: "quick", label: "Quick" },
      { id: "normal", label: "Normal" },
      { id: "deep", label: "Deep" },
    ])
    expect(DEFAULT_RESEARCH_DEPTH).toBe("normal")
    expect(researchDepthAt(0)).toBe("quick")
    expect(researchDepthAt(1)).toBe("normal")
    expect(researchDepthAt(2)).toBe("deep")
  })

  it("maps every level to a distinct prompt contract", () => {
    const instructions = RESEARCH_DEPTHS.map(({ id }) =>
      researchInstructionFor(id),
    )

    expect(new Set(instructions)).toHaveLength(3)
    expect(instructions[0]).toContain("RESEARCH DEPTH: QUICK")
    expect(instructions[1]).toContain("RESEARCH DEPTH: NORMAL")
    expect(instructions[2]).toContain("RESEARCH DEPTH: DEEP")
  })

  it("persists a valid device preference and ignores invalid storage", () => {
    const values = new Map<string, string>()
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    }

    expect(loadResearchDepth(storage)).toBe("normal")
    saveResearchDepth(storage, "deep")
    expect(values.get(RESEARCH_DEPTH_STORAGE_KEY)).toBe("deep")
    expect(loadResearchDepth(storage)).toBe("deep")

    values.set(RESEARCH_DEPTH_STORAGE_KEY, "exhaustive")
    expect(loadResearchDepth(storage)).toBe("normal")
  })
})
