// Run with: npm run seed
import "dotenv/config"; // load .env before anything reads process.env
import { MongooseCandidateRepository } from "./candidates/candidate.repository";
import { seedCandidates } from "./candidates/seedCandidates";
import { connectToDatabase, disconnectFromDatabase } from "./config/db";

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/candidate_tracker";

try {
  await connectToDatabase(MONGO_URI);
  const { created, skipped } = await seedCandidates(
    new MongooseCandidateRepository()
  );
  console.log(`Seed finished: ${created} created, ${skipped} already there.`);
} catch (error) {
  console.error("Seeding failed. Is Docker running? Try: npm run db");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1; // report failure, but still let the finally block disconnect
} finally {
  await disconnectFromDatabase(); // an open connection would stop the script from ever exiting
}
