import mongoose from "mongoose";
import { config } from "./env";
import { logger } from "./logger";

export async function connectDatabase(): Promise<void> {
  mongoose.set("strictQuery", true);
  await mongoose.connect(config.mongoUri, {
    serverSelectionTimeoutMS: 10_000
  });
  logger.info({ database: mongoose.connection.name }, "MongoDB connected");
}

export async function closeDatabase(): Promise<void> {
  await mongoose.connection.close();
  logger.info("MongoDB connection closed");
}

export function isDatabaseReady(): boolean {
  return mongoose.connection.readyState === 1;
}
