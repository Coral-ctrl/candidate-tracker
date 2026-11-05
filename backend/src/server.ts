import "dotenv/config"; // load .env before anything reads process.env
import { createApp } from "./app";
import { connectToDatabase, isDatabaseConnected } from "./config/db";
import { MongooseCandidateRepository } from "./candidates/candidate.repository";
import { createCandidateService } from "./candidates/candidate.service";

const PORT = Number(process.env.PORT) || 4000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/candidate_tracker";

try {
  await connectToDatabase(MONGO_URI); // top-level await works in ES modules
  // Composition root: the ONE place real dependencies are created and passed in
  const candidateService = createCandidateService(
    new MongooseCandidateRepository()
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
