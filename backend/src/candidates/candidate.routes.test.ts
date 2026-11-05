import { describe, test, expect, vi } from "vitest";
import { createApp } from "../app";
import { createCandidateService } from "./candidate.service";
import { InMemoryCandidateRepository } from "./inMemoryCandidateRepository";
import { withServer } from "../utils/testServer";

const validBody = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  role: "Backend Engineer",
  resumeText: "Wrote the first algorithm.",
};

// Build the real app around a repository of our choice
function appWith(repository: InMemoryCandidateRepository) {
  return createApp({
    isDatabaseConnected: () => true,
    candidateService: createCandidateService(repository),
  });
}

// Small helper so each test reads as "send this, expect that"
function send(baseUrl: string, method: string, path: string, body?: unknown) {
  return fetch(`${baseUrl}${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("candidate routes", () => {
  test("POST creates a candidate (201, stage APPLIED) and GET lists it", async () => {
    await withServer(
      appWith(new InMemoryCandidateRepository()),
      async (baseUrl) => {
        const created = await send(
          baseUrl,
          "POST",
          "/api/candidates",
          validBody
        );
        expect(created.status).toBe(201);
        expect(((await created.json()) as { stage: string }).stage).toBe(
          "APPLIED"
        );

        const list = await send(baseUrl, "GET", "/api/candidates");
        expect(((await list.json()) as unknown[]).length).toBe(1);
      }
    );
  });

  test("invalid input returns 400 with a JSON error", async () => {
    await withServer(
      appWith(new InMemoryCandidateRepository()),
      async (baseUrl) => {
        const response = await send(baseUrl, "POST", "/api/candidates", {
          ...validBody,
          email: "nope",
        });
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({
          error: "a valid email is required",
        });
      }
    );
  });

  test("malformed JSON returns 400 JSON, not an HTML error page", async () => {
    await withServer(
      appWith(new InMemoryCandidateRepository()),
      async (baseUrl) => {
        const response = await fetch(`${baseUrl}/api/candidates`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{ this is not json",
        });
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({
          error: "Request body is not valid JSON",
        });
      }
    );
  });

  test("unknown id returns 404", async () => {
    await withServer(
      appWith(new InMemoryCandidateRepository()),
      async (baseUrl) => {
        const response = await send(baseUrl, "GET", "/api/candidates/999");
        expect(response.status).toBe(404);
      }
    );
  });

  test("PATCH stage moves a candidate; an invalid stage is a 400", async () => {
    await withServer(
      appWith(new InMemoryCandidateRepository()),
      async (baseUrl) => {
        const created = (await (
          await send(baseUrl, "POST", "/api/candidates", validBody)
        ).json()) as { id: string };

        const moved = await send(
          baseUrl,
          "PATCH",
          `/api/candidates/${created.id}/stage`,
          { stage: "OFFER" }
        );
        expect(moved.status).toBe(200);
        expect(((await moved.json()) as { stage: string }).stage).toBe("OFFER");

        const bad = await send(
          baseUrl,
          "PATCH",
          `/api/candidates/${created.id}/stage`,
          { stage: "HIRED" }
        );
        expect(bad.status).toBe(400);
      }
    );
  });

  test("unexpected errors return 500 and do not leak the internal message", async () => {
    // A repository that blows up the way a lost database connection would
    class BrokenRepository extends InMemoryCandidateRepository {
      override async findById(): Promise<never> {
        throw new Error("db exploded: secret connection string");
      }
    }
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {}); // keep test output quiet

    await withServer(appWith(new BrokenRepository()), async (baseUrl) => {
      const response = await send(baseUrl, "GET", "/api/candidates/1");
      expect(response.status).toBe(500);
      const text = await response.text();
      expect(text).not.toContain("secret connection string");
    });

    consoleError.mockRestore();
  });
});
