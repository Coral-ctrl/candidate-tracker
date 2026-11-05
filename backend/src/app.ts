import express, { type Express } from "express";
import { errorHandler } from "./middleware/errorHandler";
import { createCandidateRouter } from "./candidates/candidate.routes";
import type { CandidateService } from "./candidates/candidate.service";

/** Everything the app needs from the outside world, passed in rather than imported. */
export interface AppDependencies {
  isDatabaseConnected: () => boolean;
  candidateService: CandidateService; // the business logic, with its repository already wired in
}

/**
 * Builds the Express app. Because dependencies are passed in (Dependency Inversion),
 * tests can supply fakes, and this file never imports Mongoose or Anthropic directly.
 */
export function createApp({
  isDatabaseConnected,
  candidateService,
}: AppDependencies): Express {
  const app = express();
  app.use(express.json()); // parse JSON request bodies (default limit 100kb)

  // Health check: confirms the API is up AND reports the database status.
  // `_req` starts with an underscore to show it's intentionally unused.
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      database: isDatabaseConnected() ? "connected" : "disconnected",
    });
  });

  app.use("/api/candidates", createCandidateRouter(candidateService));

  app.use(errorHandler); // MUST be last, so errors from everything above reach it

  return app;
}
