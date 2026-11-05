import { isValidObjectId, type QueryFilter, type Types } from "mongoose";
import { CandidateModel, type CandidateDocument } from "./candidate.model";
import type {
  Candidate,
  CandidateFilters,
  CandidateRepository,
  CandidateSummary,
  NewCandidate,
} from "./candidate.types";
import type { Stage } from "./stages";

// What `.lean()` returns: the plain stored object plus _id (and __v, which we ignore).
type StoredCandidate = CandidateDocument & { _id: Types.ObjectId };

// Pure mapping function: stored shape -> app shape. Pick fields explicitly so __v and _id don't leak out.
function toCandidate(doc: StoredCandidate): Candidate {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    phone: doc.phone,
    role: doc.role,
    resumeText: doc.resumeText,
    source: doc.source,
    stage: doc.stage,
    notes: doc.notes,
    summary: doc.summary,
    archived: doc.archived,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class MongooseCandidateRepository implements CandidateRepository {
  async create(input: NewCandidate): Promise<Candidate> {
    const created = await CandidateModel.create(input);
    return toCandidate(created.toObject() as StoredCandidate);
  }

  async findById(id: string): Promise<Candidate | null> {
    if (!isValidObjectId(id)) return null; // otherwise Mongoose throws a CastError
    const doc = await CandidateModel.findById(id).lean<StoredCandidate>();
    return doc ? toCandidate(doc) : null;
  }

  async list({
    stage,
    role,
    includeArchived,
  }: CandidateFilters): Promise<Candidate[]> {
    const query: QueryFilter<CandidateDocument> = {};
    if (stage) query.stage = stage;
    if (role) query.role = role;
    if (!includeArchived) query.archived = false;

    const docs = await CandidateModel.find(query)
      .sort({ createdAt: -1 })
      .lean<StoredCandidate[]>();
    return docs.map(toCandidate);
  }

  addNote(id: string, text: string): Promise<Candidate | null> {
    // $push appends atomically inside MongoDB, so two simultaneous notes can't overwrite each other.
    return this.update(id, { $push: { notes: { text } } });
  }

  updateStage(id: string, stage: Stage): Promise<Candidate | null> {
    return this.update(id, { $set: { stage } });
  }

  setArchived(id: string, archived: boolean): Promise<Candidate | null> {
    return this.update(id, { $set: { archived } });
  }

  setSummary(id: string, summary: CandidateSummary): Promise<Candidate | null> {
    return this.update(id, { $set: { summary } }); // replaces any earlier summary
  }

  // Shared helper: apply an update and return the document AFTER the change (or null if not found).
  private async update(
    id: string,
    update: Record<string, unknown>
  ): Promise<Candidate | null> {
    if (!isValidObjectId(id)) return null;
    const doc = await CandidateModel.findByIdAndUpdate(id, update, {
      returnDocument: "after", // default is "before"; `new: true` is deprecated in Mongoose 9
      runValidators: true, // update queries skip schema validation unless you ask
    }).lean<StoredCandidate>();
    return doc ? toCandidate(doc) : null;
  }
}
