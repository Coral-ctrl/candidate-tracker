import mongoose from "mongoose";

export async function connectToDatabase(mongoUri: string): Promise<void> {
  // Fail after 5s instead of the default 30s, so a missing database is obvious quickly
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  console.log("Connected to MongoDB");
}

// Exposed as a function so the rest of the app doesn't need to know how Mongoose tracks state
export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1; // 1 = connected
}

export async function disconnectFromDatabase(): Promise<void> {
  await mongoose.disconnect();
}
