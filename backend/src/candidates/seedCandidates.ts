import type { CandidateRepository } from "./candidate.types";
import { SEED_CANDIDATES } from "./seedData";

export interface SeedResult {
  created: number;
  skipped: number;
}

/**
 * Adds any seed candidates that aren't there yet. It takes the repository interface, so it can be
 * tested with the in-memory fake and never needs a database.
 *
 * It only ever adds: nothing is deleted or overwritten, so it is safe to run twice or on a database
 * that already holds real work. Email is what identifies "already there".
 */
export async function seedCandidates(
  repository: CandidateRepository
): Promise<SeedResult> {
  const existing = await repository.list({ includeArchived: true });
  const existingEmails = new Set(existing.map((candidate) => candidate.email));

  let created = 0;
  let skipped = 0;

  // One at a time on purpose: this keeps the "date added" order the same as the list in seedData.ts
  for (const { notes = [], ...candidate } of SEED_CANDIDATES) {
    if (existingEmails.has(candidate.email)) {
      skipped += 1;
      continue;
    }

    const { id } = await repository.create(candidate);
    for (const note of notes) {
      await repository.addNote(id, note);
    }
    created += 1;
  }

  return { created, skipped };
}
