import {
  CONTENT_QUALITIES,
  type ContentQuality,
  type GeneratedSummary,
} from "./summary.types";

// Everything here is plain code, so it behaves the same however the model behaves.
// That makes it the part of the AI feature that can be tested reliably.

const MAX_SKILLS = 20;
const MAX_HIGHLIGHTS = 5;
const MAX_ITEM_LENGTH = 300;

// Control characters (but not tabs or line breaks), plus U+FFFD, which marks undecodable bytes
const BROKEN_CHARACTER =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\uFFFD]/g;
const MAX_BROKEN_SHARE = 0.02; // a couple of mangled quotes is normal; this much is not

// One signal among several, not a real defence: rewording gets past any list of phrases.
// That's fine, because all it does is show the recruiter a warning.
const INJECTION_PATTERNS = [
  /\b(ignore|disregard|forget)\b.{0,30}\b(instructions|prompt|above)\b/i,
  /^\s*(system|assistant)\s*:/im,
  /\bsystem prompt\b/i,
  /\byou are no longer\b/i,
  /<\/?resume\b/i,
];

/** True for text not worth sending to the AI, such as a PDF renamed to .txt. */
export function looksGarbled(text: string): boolean {
  if (text.startsWith("%PDF-")) return true;
  const brokenCount = text.match(BROKEN_CHARACTER)?.length ?? 0;
  return brokenCount / text.length > MAX_BROKEN_SHARE;
}

export function looksLikeInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Drops any skill that doesn't literally appear in the text, so the model can't invent one.
 * Its limit: it can't catch a skill named inside an injected instruction, as those words are in the text.
 */
export function keepGroundedSkills(
  skills: string[],
  resumeText: string
): string[] {
  const source = resumeText.toLowerCase();
  return skills.filter((skill) => source.includes(skill.toLowerCase()));
}

function isContentQuality(value: unknown): value is ContentQuality {
  return (CONTENT_QUALITIES as readonly unknown[]).includes(value);
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function cleanList(items: string[], maxItems: number): string[] {
  return items
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && item.length <= MAX_ITEM_LENGTH)
    .slice(0, maxItems);
}

/**
 * Checks raw model output, returning null if it isn't the agreed shape. Structured output should
 * guarantee the shape, but this is the boundary between the model and the app, so check anyway.
 */
export function parseSummaryOutput(output: unknown): GeneratedSummary | null {
  if (typeof output !== "object" || output === null) return null;
  const { contentQuality, skills, highlights, injectionSuspected } =
    output as Record<string, unknown>;

  if (
    !isContentQuality(contentQuality) ||
    !isStringArray(skills) ||
    !isStringArray(highlights) ||
    typeof injectionSuspected !== "boolean"
  ) {
    return null;
  }

  return {
    contentQuality,
    skills: cleanList(skills, MAX_SKILLS),
    highlights: cleanList(highlights, MAX_HIGHLIGHTS),
    injectionSuspected,
  };
}
