export const CONTENT_QUALITIES = ["usable", "limited", "unusable"] as const;
export type ContentQuality = (typeof CONTENT_QUALITIES)[number];

/** The finished, checked summary. This is the only shape the rest of the app ever sees. */
export interface GeneratedSummary {
  contentQuality: ContentQuality;
  skills: string[];
  highlights: string[];
  injectionSuspected: boolean; // the text seems to contain instructions aimed at the AI
}

/**
 * Anything that can turn resume text into a raw summary. The app depends on this interface,
 * so tests can use a fake, and swapping AI provider means writing one new class.
 *
 * It returns `unknown` on purpose: model output is untrusted, so nothing may use it
 * until parseSummaryOutput has checked it.
 */
export interface SummaryProvider {
  summarize(resumeText: string): Promise<unknown>;
}
