import "dotenv/config"; // load .env before anything reads process.env
import { createApp } from "./app";
import { connectToDatabase, isDatabaseConnected } from "./config/db";
import { MongooseCandidateRepository } from "./candidates/candidate.repository";
import { createCandidateService } from "./candidates/candidate.service";
import { AnthropicSummaryProvider } from "./summary/anthropicSummaryProvider";
import { createSummaryService } from "./summary/summary.service";
import type { SummaryProvider } from "./summary/summary.types";

const PORT = Number(process.env.PORT) || 4000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/candidate_tracker";

// With no key, the rest of the app still works: each summary request just fails with the normal 503
function createSummaryProvider(): SummaryProvider {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) return new AnthropicSummaryProvider(apiKey);

  console.warn(
    "ANTHROPIC_API_KEY is not set, so AI summaries are unavailable."
  );
  return {
    summarize: async () => {
      throw new Error("ANTHROPIC_API_KEY is not set");
    },
  };
}

try {
  await connectToDatabase(MONGO_URI); // top-level await works in ES modules
  // Composition root: the ONE place real dependencies are created and passed in
  const candidateService = createCandidateService(
    new MongooseCandidateRepository(),
    createSummaryService(createSummaryProvider())
  );
  const app = createApp({ isDatabaseConnected, candidateService });
  app.listen(PORT, () =>
    console.log(`API running on http://localhost:${PORT}`)
  );
} catch (error) {
  console.error(
    "Could not connect to MongoDB. Is Docker running? Try: npm run db"
  );
  // In TypeScript a caught error is `unknown`, so check its type before reading .message
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
