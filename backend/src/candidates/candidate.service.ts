import { NotFoundError } from "../utils/errors";
import { compareByStage } from "./stages";
import {
  parseListQuery,
  parseNewCandidate,
  parseNoteText,
  parseStage,
  type ListQuery,
} from "./candidate.validation";
import type { Candidate, CandidateRepository } from "./candidate.types";
import type { SummaryService } from "../summary/summary.service";

export function createCandidateService(
  repository: CandidateRepository,
  summaries: SummaryService
) {
  // The repository returns null for "no such id"; the service turns that into an error
  async function orNotFound(
    pending: Promise<Candidate | null>
  ): Promise<Candidate> {
    const candidate = await pending;
    if (!candidate) throw new NotFoundError("Candidate");
    return candidate;
  }

  return {
    // The stage is set here, ignoring anything the client sent
    async createCandidate(input: unknown) {
      return repository.create({
        ...parseNewCandidate(input),
        stage: "APPLIED",
      });
    },

    async listCandidates(query: ListQuery) {
      const { sort, ...filters } = parseListQuery(query);
      const candidates = await repository.list(filters); // newest first
      // sort() is stable, so candidates in the same stage stay newest first.
      // Copy first so we never mutate the repository's array.
      return sort === "stage"
        ? [...candidates].sort(compareByStage)
        : candidates;
    },

    getCandidate: (id: string) => orNotFound(repository.findById(id)),
    async addNote(id: string, input: unknown) {
      return orNotFound(repository.addNote(id, parseNoteText(input)));
    },
    async moveStage(id: string, input: unknown) {
      return orNotFound(repository.updateStage(id, parseStage(input)));
    },
    archive: (id: string) => orNotFound(repository.setArchived(id, true)),
    unarchive: (id: string) => orNotFound(repository.setArchived(id, false)),

    // Looks the candidate up first, so an unknown id is a 404 and never costs an AI call.
    // If generating fails, nothing is saved, so any earlier summary stays in place.
    async generateSummary(id: string) {
      const candidate = await orNotFound(repository.findById(id));
      const summary = await summaries.generateSummary(candidate.resumeText);
      return orNotFound(
        repository.setSummary(id, { ...summary, generatedAt: new Date() })
      );
    },
  };
}

export type CandidateService = ReturnType<typeof createCandidateService>;
