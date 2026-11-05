import { Router } from "express";
import type { CandidateService } from "./candidate.service";
import { createCandidateController } from "./candidate.controller";

/** Builds the router for /api/candidates. Mounted in app.ts, so paths here are relative to that. */
export function createCandidateRouter(service: CandidateService): Router {
  const router = Router();
  const controller = createCandidateController(service);

  router.post("/", controller.create);
  router.get("/", controller.list);
  router.get("/:id", controller.get);
  router.post("/:id/notes", controller.addNote);
  router.patch("/:id/stage", controller.moveStage); // PATCH = partial update of one field
  router.post("/:id/archive", controller.archive);
  router.post("/:id/unarchive", controller.unarchive);
  router.post("/:id/summary", controller.generateSummary); // POST: it costs money and changes data

  return router;
}
