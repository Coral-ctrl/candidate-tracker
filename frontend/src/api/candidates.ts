// The frontend's single doorway to the backend. Components call these functions and never
// touch fetch or URLs directly, so a change to the API only means changing this one file.

// Same order as backend/src/candidates/stages.ts. The two apps are separate packages,
// so this list is a deliberate copy (see ADR-006).
export const STAGES = [
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
] as const;
export type Stage = (typeof STAGES)[number];

export type SortBy = "dateAdded" | "stage";

// Dates are strings here, not Date objects: JSON has no date type,
// so res.json() on the backend turned them into ISO strings on the way out.
export interface Note {
  text: string;
  createdAt: string;
}

export interface CandidateSummary {
  contentQuality: "usable" | "limited" | "unusable";
  skills: string[];
  highlights: string[];
  injectionSuspected: boolean;
  generatedAt: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  resumeText: string;
  source?: string;
  stage: Stage;
  notes: Note[];
  summary?: CandidateSummary;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export type NewCandidateInput = Pick<
  Candidate,
  "name" | "email" | "role" | "resumeText"
> &
  Partial<Pick<Candidate, "phone" | "source">>;

export interface ListParams {
  stage?: Stage;
  role?: string;
  sort?: SortBy;
  includeArchived?: boolean;
}

// All requests go through here, so error handling lives in exactly one place.
async function request<T>(
  path: string,
  method = "GET",
  body?: unknown
): Promise<T> {
  const response = await fetch(`/api/candidates${path}`, {
    method,
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  // fetch only rejects on network failure. A 400 or 404 still "succeeds", so check it ourselves.
  if (!response.ok) {
    // Our API sends { error: "..." }. A proxy failure might not be JSON, hence the catch.
    const data = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(
      data?.error ?? `Request failed with status ${response.status}`
    );
  }

  // `as T` is a promise to the compiler, not a runtime check. Acceptable because we own this API.
  return (await response.json()) as T;
}

export function listCandidates(params: ListParams = {}): Promise<Candidate[]> {
  // Only send what is set; URLSearchParams also handles encoding (e.g. spaces in a role name)
  const query = new URLSearchParams();
  if (params.stage) query.set("stage", params.stage);
  if (params.role) query.set("role", params.role);
  if (params.sort) query.set("sort", params.sort);
  if (params.includeArchived) query.set("includeArchived", "true");

  const queryString = query.toString();
  return request<Candidate[]>(queryString ? `?${queryString}` : "");
}

export function getCandidate(id: string): Promise<Candidate> {
  return request<Candidate>(`/${id}`);
}

export function createCandidate(input: NewCandidateInput): Promise<Candidate> {
  return request<Candidate>("", "POST", input);
}

export function addNote(id: string, text: string): Promise<Candidate> {
  return request<Candidate>(`/${id}/notes`, "POST", { text });
}

export function moveStage(id: string, stage: Stage): Promise<Candidate> {
  return request<Candidate>(`/${id}/stage`, "PATCH", { stage });
}

export function archiveCandidate(id: string): Promise<Candidate> {
  return request<Candidate>(`/${id}/archive`, "POST");
}

export function unarchiveCandidate(id: string): Promise<Candidate> {
  return request<Candidate>(`/${id}/unarchive`, "POST");
}

export function generateSummary(id: string): Promise<Candidate> {
  return request<Candidate>(`/${id}/summary`, "POST");
}
