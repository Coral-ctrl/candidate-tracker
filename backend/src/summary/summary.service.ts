import { SummaryUnavailableError } from "../utils/errors";
import type { GeneratedSummary, SummaryProvider } from "./summary.types";
import {
  keepGroundedSkills,
  looksGarbled,
  looksLikeInjection,
  parseSummaryOutput,
} from "./summary.validation";

/**
 * The module's front door. It knows nothing about candidates, HTTP or databases:
 * text goes in, and a checked summary comes out.
 */
export function createSummaryService(provider: SummaryProvider) {
  return {
    async generateSummary(resumeText: string): Promise<GeneratedSummary> {
      // Garbled text gets a reliable answer, and the API call is saved
      if (looksGarbled(resumeText)) {
        return {
          contentQuality: "unusable",
          skills: [],
          highlights: [],
          injectionSuspected: false,
        };
      }

      let output: unknown;
      try {
        output = await provider.summarize(resumeText);
      } catch (error) {
        console.error("AI summary request failed:", error); // details stay on the server
        throw new SummaryUnavailableError();
      }

      const summary = parseSummaryOutput(output);
      if (!summary) {
        // The output itself isn't logged: it may repeat personal details from the resume
        console.error("AI summary output did not match the expected shape");
        throw new SummaryUnavailableError();
      }

      return {
        ...summary,
        skills: keepGroundedSkills(summary.skills, resumeText),
        // Either signal is enough, so the warning still shows if the model is fooled and doesn't report it
        injectionSuspected:
          summary.injectionSuspected || looksLikeInjection(resumeText),
      };
    },
  };
}

export type SummaryService = ReturnType<typeof createSummaryService>;
