import type { Stage } from "./stages";
import type { GeneratedSummary } from "../summary/summary.types";

export interface Note {
  text: string;
  createdAt: Date;
}

// The AI module's result, plus when it was made
export type CandidateSummary = GeneratedSummary & { generatedAt: Date };

/** What the rest of the app sees. Plain data: no Mongoose types, `id` is a string. */
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
  summary?: CandidateSummary; // undefined until first generated
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type NewCandidate = Pick<
  Candidate,
  "name" | "email" | "role" | "resumeText" | "stage"
> &
  Partial<Pick<Candidate, "phone" | "source">>;

export interface CandidateFilters {
  stage?: Stage;
  role?: string;
  includeArchived?: boolean; // default: archived candidates are hidden
}

export interface CandidateRepository {
  create(input: NewCandidate): Promise<Candidate>;
  findById(id: string): Promise<Candidate | null>;
  /** Newest first. Sorting by stage is a business rule, so the service does it (2B). */
  list(filters: CandidateFilters): Promise<Candidate[]>;
  addNote(id: string, text: string): Promise<Candidate | null>;
  updateStage(id: string, stage: Stage): Promise<Candidate | null>;
  setArchived(id: string, archived: boolean): Promise<Candidate | null>;
  setSummary(id: string, summary: CandidateSummary): Promise<Candidate | null>;
}
