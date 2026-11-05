import { describe, test, expect } from "vitest";
import { createApp } from "./app";
import { createCandidateService } from "./candidates/candidate.service";
import { InMemoryCandidateRepository } from "./candidates/inMemoryCandidateRepository";
import { withServer } from "./utils/testServer";

// This test never generates a summary, so this only has to satisfy the type
const unusedSummaries = {
  generateSummary: async () => {
    throw new Error("not used in this test");
  },
};

describe("GET /api/health", () => {
  test("reports database status from the injected dependency", async () => {
    // Fakes for both dependencies: no real database needed
    const app = createApp({
      isDatabaseConnected: () => false,
      candidateService: createCandidateService(
        new InMemoryCandidateRepository(),
        unusedSummaries
      ),
    });

    await withServer(app, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/health`);
      expect(await response.json()).toEqual({
        status: "ok",
        database: "disconnected",
      });
    });
  });
});
