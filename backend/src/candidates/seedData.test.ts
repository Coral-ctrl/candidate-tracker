import { describe, test, expect } from "vitest";
import { parseNewCandidate } from "./candidate.validation";
import { InMemoryCandidateRepository } from "./inMemoryCandidateRepository";
import { seedCandidates } from "./seedCandidates";
import { SEED_CANDIDATES } from "./seedData";

describe("seed data", () => {
  // The seed writes through the repository, which skips the service's validation.
  // This stops the seed from creating records the app itself would refuse.
  test.each(SEED_CANDIDATES)(
    "$name would pass the API's validation",
    (candidate) => {
      expect(() => parseNewCandidate(candidate)).not.toThrow();
    }
  );

  test("emails are unique, because seeding uses them to spot existing candidates", () => {
    const emails = SEED_CANDIDATES.map((candidate) => candidate.email);
    expect(new Set(emails).size).toBe(emails.length);
  });
});

describe("seedCandidates", () => {
  test("creates each candidate with its stage and notes", async () => {
    const repository = new InMemoryCandidateRepository();

    const result = await seedCandidates(repository);

    expect(result).toEqual({ created: SEED_CANDIDATES.length, skipped: 0 });
    const offer = await repository.list({ stage: "OFFER" });
    expect(offer.map((candidate) => candidate.name)).toEqual(["Sam Okafor"]);
    expect(offer[0]?.notes.map((note) => note.text)).toEqual([
      "Offer sent, waiting on a reply.",
    ]);
  });

  test("running it again adds nothing and leaves other candidates alone", async () => {
    const repository = new InMemoryCandidateRepository();
    await repository.create({
      name: "Already Here",
      email: "already.here@example.com",
      role: "Tester",
      resumeText: "Existing candidate.",
      stage: "APPLIED",
    });

    await seedCandidates(repository);
    const secondRun = await seedCandidates(repository);

    expect(secondRun).toEqual({ created: 0, skipped: SEED_CANDIDATES.length });
    const all = await repository.list({});
    expect(all).toHaveLength(SEED_CANDIDATES.length + 1);
    expect(all.some((candidate) => candidate.name === "Already Here")).toBe(
      true
    );
  });
});
