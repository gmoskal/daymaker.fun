export const RESEARCH_DEPTHS = [
  {
    id: "quick",
    instruction:
      "RESEARCH DEPTH: QUICK. Optimize for speed and finish in one pass. Run independent lookups in parallel, use one strong current source per proposed stop, validate only the essential facts needed to make the plan usable, and do not compare alternatives unless the first choice clearly fails a Need.",
    label: "Quick",
  },
  {
    id: "normal",
    instruction:
      "RESEARCH DEPTH: NORMAL. Balance speed and confidence. Run independent lookups in parallel, use up to two strong current sources for important choices, validate route practicality, opening hours, parking, and other facts that affect the plan, and compare alternatives only when it materially improves the fit.",
    label: "Normal",
  },
  {
    id: "deep",
    instruction:
      "RESEARCH DEPTH: DEEP. Prioritize completeness and confidence. Cross-check key choices against multiple current sources, compare credible alternatives, validate routes, opening hours, parking, conditions, and reservation constraints, and explain why each selected option best satisfies the Needs. Extra research time is expected.",
    label: "Deep",
  },
] as const

export type ResearchDepth = (typeof RESEARCH_DEPTHS)[number]["id"]

export const DEFAULT_RESEARCH_DEPTH: ResearchDepth = "normal"
export const RESEARCH_DEPTH_STORAGE_KEY = "daymaker:research-depth:v1"

type ResearchDepthStorage = Pick<Storage, "getItem" | "setItem">

const isResearchDepth = (value: string | null): value is ResearchDepth =>
  RESEARCH_DEPTHS.some((option) => option.id === value)

export const researchDepthAt = (index: number): ResearchDepth =>
  RESEARCH_DEPTHS[index]?.id ?? DEFAULT_RESEARCH_DEPTH

export const researchDepthIndex = (depth: ResearchDepth) =>
  RESEARCH_DEPTHS.findIndex((option) => option.id === depth)

export const researchDepthLabelFor = (depth: ResearchDepth) =>
  RESEARCH_DEPTHS.find((option) => option.id === depth)?.label ??
  RESEARCH_DEPTHS[1].label

export const researchInstructionFor = (depth: ResearchDepth) =>
  RESEARCH_DEPTHS.find((option) => option.id === depth)?.instruction ??
  RESEARCH_DEPTHS[1].instruction

export const loadResearchDepth = (
  storage: ResearchDepthStorage,
): ResearchDepth => {
  try {
    const stored = storage.getItem(RESEARCH_DEPTH_STORAGE_KEY)
    return isResearchDepth(stored) ? stored : DEFAULT_RESEARCH_DEPTH
  } catch {
    return DEFAULT_RESEARCH_DEPTH
  }
}

export const saveResearchDepth = (
  storage: ResearchDepthStorage,
  depth: ResearchDepth,
) => {
  try {
    storage.setItem(RESEARCH_DEPTH_STORAGE_KEY, depth)
  } catch {
    // The preference remains usable for this visit when storage is unavailable.
  }
}
