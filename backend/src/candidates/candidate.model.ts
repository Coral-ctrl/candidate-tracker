import { Schema, model } from "mongoose";
import { STAGES } from "./stages";
import type { Candidate } from "./candidate.types";

// The stored shape: like Candidate, but Mongoose adds _id and manages timestamps.
export type CandidateDocument = Omit<Candidate, "id">;

const noteSchema = new Schema(
  {
    text: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false } // notes don't need their own ids
);

const summarySchema = new Schema(
  {
    skills: { type: [String], default: [] },
    highlights: { type: [String], default: [] },
    generatedAt: { type: Date, required: true },
  },
  { _id: false }
);

const candidateSchema = new Schema<CandidateDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    role: { type: String, required: true, trim: true },
    resumeText: { type: String, required: true },
    source: { type: String, trim: true },
    stage: { type: String, enum: [...STAGES], required: true }, // reuses stages.ts, one source of truth
    notes: { type: [noteSchema], default: [] },
    summary: { type: summarySchema }, // no default, so it stays undefined until generated
    archived: { type: Boolean, default: false },
  },
  { timestamps: true } // Mongoose maintains createdAt and updatedAt for you
);

export const CandidateModel = model<CandidateDocument>(
  "Candidate",
  candidateSchema
);
