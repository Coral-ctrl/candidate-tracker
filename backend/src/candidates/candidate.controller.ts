import type { Request, Response } from "express";
import type { CandidateService } from "./candidate.service";

// A request body is untrusted, so read one field safely; undefined if the body isn't an object.
// The service validates the value itself, so this only has to avoid crashing.
function readField(body: unknown, key: string): unknown {
  return typeof body === "object" && body !== null
    ? (body as Record<string, unknown>)[key]
    : undefined;
}

// A query value can be a string, an array (?stage=A&stage=B) or an object; we accept only a single string.
function queryString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

/**
 * Controllers translate HTTP <-> service calls and nothing else.
 * No try/catch needed: Express 5 forwards rejected promises to the error middleware.
 * Note it receives the service (an interface), never the repository or Mongoose.
 */
export function createCandidateController(service: CandidateService) {
  return {
    async create(req: Request, res: Response) {
      const candidate = await service.createCandidate(req.body);
      res.status(201).json(candidate);
    },

    async list(req: Request, res: Response) {
      const candidates = await service.listCandidates({
        stage: queryString(req.query.stage),
        role: queryString(req.query.role),
        sort: queryString(req.query.sort),
        includeArchived: queryString(req.query.includeArchived),
      });
      res.json(candidates);
    },

    // `Request<{ id: string }>` tells TypeScript that req.params.id is a string
    async get(req: Request<{ id: string }>, res: Response) {
      res.json(await service.getCandidate(req.params.id));
    },

    async addNote(req: Request<{ id: string }>, res: Response) {
      const candidate = await service.addNote(
        req.params.id,
        readField(req.body, "text")
      );
      res.status(201).json(candidate);
    },

    async moveStage(req: Request<{ id: string }>, res: Response) {
      res.json(
        await service.moveStage(req.params.id, readField(req.body, "stage"))
      );
    },

    async archive(req: Request<{ id: string }>, res: Response) {
      res.json(await service.archive(req.params.id));
    },

    async unarchive(req: Request<{ id: string }>, res: Response) {
      res.json(await service.unarchive(req.params.id));
    },

    async generateSummary(req: Request<{ id: string }>, res: Response) {
      res.json(await service.generateSummary(req.params.id));
    },
  };
}
