import { describe, test, expect } from "vitest";
import { createCandidateService } from "./candidate.service";
import { InMemoryCandidateRepository } from "./inMemoryCandidateRepository";
import { NotFoundError, ValidationError } from "../utils/errors";

function makeService() {
  return createCandidateService(new InMemoryCandidateRepository());
}

const validInput = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  role: "Backend Engineer",
  resumeText: "Wrote the first algorithm.",
};

describe("createCandidate", () => {
  test("always starts at APPLIED, ignoring a client-supplied stage", async () => {
    const created = await makeService().createCandidate({
      ...validInput,
      stage: "OFFER",
    });
    expect(created.stage).toBe("APPLIED");
  });

  test("rejects a bad email", async () => {
    await expect(
      makeService().createCandidate({ ...validInput, email: "not-an-email" })
    ).rejects.toThrow(ValidationError);
  });
});

describe("listCandidates", () => {
  test("sorting by stage follows pipeline order, newest first within a stage", async () => {
    const service = makeService();
    const c1 = await service.createCandidate({ ...validInput, name: "c1" });
    await service.createCandidate({ ...validInput, name: "c2" });
    const c3 = await service.createCandidate({ ...validInput, name: "c3" });
    await service.createCandidate({ ...validInput, name: "c4" });
    await service.moveStage(c1.id, "OFFER");
    await service.moveStage(c3.id, "OFFER");

    const sorted = await service.listCandidates({ sort: "stage" });

    expect(sorted.map((c) => c.name)).toEqual(["c4", "c2", "c3", "c1"]);
  });

  test("rejects an unknown stage filter instead of ignoring it", async () => {
    await expect(
      makeService().listCandidates({ stage: "HIRED" })
    ).rejects.toThrow(ValidationError);
  });

  test("hides archived candidates unless asked", async () => {
    const service = makeService();
    const created = await service.createCandidate(validInput);
    await service.archive(created.id);

    expect(await service.listCandidates({})).toHaveLength(0);
    expect(
      await service.listCandidates({ includeArchived: "true" })
    ).toHaveLength(1);
  });
});

describe("notes", () => {
  test("appends notes in order and rejects blank ones", async () => {
    const service = makeService();
    const created = await service.createCandidate(validInput);
    await service.addNote(created.id, "first");
    const updated = await service.addNote(created.id, "  second  ");

    expect(updated.notes.map((n) => n.text)).toEqual(["first", "second"]);
    await expect(service.addNote(created.id, "   ")).rejects.toThrow(
      ValidationError
    );
  });
});

describe("moveStage", () => {
  test("allows any stage to any stage, but rejects unknown stages", async () => {
    const service = makeService();
    const created = await service.createCandidate(validInput);
    await service.moveStage(created.id, "OFFER");

    const movedBack = await service.moveStage(created.id, "APPLIED"); // no workflow rules
    expect(movedBack.stage).toBe("APPLIED");
    await expect(service.moveStage(created.id, "HIRED")).rejects.toThrow(
      ValidationError
    );
  });

  test("unknown candidate id raises NotFoundError", async () => {
    await expect(makeService().getCandidate("999")).rejects.toThrow(
      NotFoundError
    );
  });
});
