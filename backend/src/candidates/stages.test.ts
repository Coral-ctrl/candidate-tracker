import { describe, test, expect } from "vitest";
import { compareByStage, isValidStage, type Stage } from "./stages";

describe("compareByStage", () => {
  test("sorts by pipeline order, not alphabetically", () => {
    const candidates: { stage: Stage }[] = [
      { stage: "SCREENING" },
      { stage: "OFFER" },
      { stage: "APPLIED" },
      { stage: "INTERVIEW" },
    ];

    const sortedStages = [...candidates]
      .sort(compareByStage)
      .map((c) => c.stage);

    expect(sortedStages).toEqual([
      "APPLIED",
      "SCREENING",
      "INTERVIEW",
      "OFFER",
    ]);
  });
});

describe("isValidStage", () => {
  test("accepts known stages and rejects anything else", () => {
    expect(isValidStage("OFFER")).toBe(true);
    expect(isValidStage("offer")).toBe(false); // case-sensitive on purpose
    expect(isValidStage("HIRED")).toBe(false);
  });
});
