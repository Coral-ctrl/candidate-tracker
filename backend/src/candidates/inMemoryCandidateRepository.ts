import type {
  Candidate,
  CandidateFilters,
  CandidateRepository,
  CandidateSummary,
  NewCandidate,
} from "./candidate.types";
import type { Stage } from "./stages";

export class InMemoryCandidateRepository implements CandidateRepository {
  private candidates: Candidate[] = [];
  private nextId = 1;

  async create(input: NewCandidate): Promise<Candidate> {
    const now = new Date();
    const candidate: Candidate = {
      ...input,
      id: String(this.nextId++),
      notes: [],
      archived: false,
      createdAt: now,
      updatedAt: now,
    };
    this.candidates.push(candidate);
    return candidate;
  }

  async findById(id: string): Promise<Candidate | null> {
    return this.candidates.find((c) => c.id === id) ?? null;
  }

  async list({
    stage,
    role,
    includeArchived,
  }: CandidateFilters): Promise<Candidate[]> {
    return this.candidates
      .filter((c) => (stage ? c.stage === stage : true))
      .filter((c) => (role ? c.role === role : true))
      .filter((c) => (includeArchived ? true : !c.archived))
      .reverse(); // newest first, like the real repository (filter already returned a copy)
  }

  async addNote(id: string, text: string): Promise<Candidate | null> {
    return this.modify(id, (c) =>
      c.notes.push({ text, createdAt: new Date() })
    );
  }

  async updateStage(id: string, stage: Stage): Promise<Candidate | null> {
    return this.modify(id, (c) => {
      c.stage = stage;
    });
  }

  async setArchived(id: string, archived: boolean): Promise<Candidate | null> {
    return this.modify(id, (c) => {
      c.archived = archived;
    });
  }

  async setSummary(
    id: string,
    summary: CandidateSummary
  ): Promise<Candidate | null> {
    return this.modify(id, (c) => {
      c.summary = summary;
    });
  }

  private modify(
    id: string,
    change: (candidate: Candidate) => void
  ): Candidate | null {
    const candidate = this.candidates.find((c) => c.id === id);
    if (!candidate) return null;
    change(candidate);
    candidate.updatedAt = new Date();
    return candidate;
  }
}
