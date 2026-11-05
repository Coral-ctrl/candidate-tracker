// Pipeline order. Sorting "by stage" means by position in this list, NOT alphabetically.
// (MongoDB sorts strings alphabetically, which would put INTERVIEW before SCREENING.)
export const STAGES = [
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
] as const;

// Derives the type "APPLIED" | "SCREENING" | ... from the list, so the two can't drift apart
export type Stage = (typeof STAGES)[number];

// Type guard: if this returns true, TypeScript treats `value` as a Stage from then on
export function isValidStage(value: string): value is Stage {
  return (STAGES as readonly string[]).includes(value);
}

// Comparator for Array.prototype.sort
export function compareByStage(
  candidateA: { stage: Stage },
  candidateB: { stage: Stage }
): number {
  return STAGES.indexOf(candidateA.stage) - STAGES.indexOf(candidateB.stage);
}
