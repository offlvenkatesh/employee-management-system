import type { Request, Response } from "express";
import { createApp } from "./app";
import { connectDatabase } from "./config/database";
import { config } from "./config/env";
import { seedEmployees } from "./scripts/seed-data";

const app = createApp();
let bootstrapPromise: Promise<void> | undefined;

async function bootstrapOnce(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = connectDatabase().then(async () => {
      if (config.seedOnStart) await seedEmployees();
    });
  }
  return bootstrapPromise;
}

export default async function handler(req: Request, res: Response) {
  if (req.url === "/health" || req.url === "/ready") {
    return app(req, res);
  }

  await bootstrapOnce();
  return app(req, res);
}
