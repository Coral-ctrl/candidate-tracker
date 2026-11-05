import { ValidationError } from "../utils/errors";
import { isValidStage, type Stage } from "./stages";
import type { CandidateFilters, NewCandidate } from "./candidate.types";

const MAX_RESUME_LENGTH = 50_000; // input guard: also caps what we ever send to the AI later
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SortBy = "dateAdded" | "stage";

// Query-string values arrive as plain strings (or missing)
export interface ListQuery {
  stage?: string;
  role?: string;
  sort?: string;
  includeArchived?: string;
}

// Read one field from an untrusted body: trimmed string, or undefined if missing / not a string
function readString(
  body: Record<string, unknown>,
  field: string
): string | undefined {
  const value = body[field];
  return typeof value === "string" ? value.trim() : undefined;
}

export function parseNewCandidate(input: unknown): Omit<NewCandidate, "stage"> {
  if (typeof input !== "object" || input === null) {
    throw new ValidationError("Request body must be a JSON object");
  }
  const body = input as Record<string, unknown>;

  const name = readString(body, "name");
  const email = readString(body, "email");
  const role = readString(body, "role");
  const resumeText = readString(body, "resumeText");

  if (!name) throw new ValidationError("name is required");
  if (!email || !EMAIL_PATTERN.test(email))
    throw new ValidationError("a valid email is required");
  if (!role) throw new ValidationError("role is required");
  if (!resumeText) throw new ValidationError("resumeText is required");
  if (resumeText.length > MAX_RESUME_LENGTH) {
    throw new ValidationError(
      `resumeText must be at most ${MAX_RESUME_LENGTH} characters`
    );
  }

  return {
    name,
    email,
    role,
    resumeText,
    phone: readString(body, "phone") || undefined, // "" becomes undefined
    source: readString(body, "source") || undefined,
  };
}

export function parseNoteText(input: unknown): string {
  const text = typeof input === "string" ? input.trim() : "";
  if (!text) throw new ValidationError("note text is required");
  return text;
}

export function parseStage(input: unknown): Stage {
  if (typeof input !== "string" || !isValidStage(input)) {
    throw new ValidationError("stage must be one of the pipeline stages");
  }
  return input;
}

export function parseListQuery(
  query: ListQuery
): CandidateFilters & { sort: SortBy } {
  const { stage, role, sort = "dateAdded", includeArchived } = query;

  if (stage !== undefined && !isValidStage(stage)) {
    throw new ValidationError(`unknown stage "${stage}"`);
  }
  if (sort !== "dateAdded" && sort !== "stage") {
    throw new ValidationError(`sort must be "dateAdded" or "stage"`);
  }

  return {
    stage,
    role: role || undefined,
    sort,
    includeArchived: includeArchived === "true",
  };
}
