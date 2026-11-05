import { describe, test, expect } from "vitest";
import { createApp } from "./app";
import { createCandidateService } from "./candidates/candidate.service";
import { InMemoryCandidateRepository } from "./candidates/inMemoryCandidateRepository";
import { withServer } from "./utils/testServer";

describe("GET /api/health", () => {
  test("reports database status from the injected dependency", async () => {
    // Fakes for both dependencies: no real database needed
    const app = createApp({
      isDatabaseConnected: () => false,
      candidateService: createCandidateService(
        new InMemoryCandidateRepository()
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
