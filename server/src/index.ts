import http from "http";
import { createApp } from "./app";
import { closeDatabase, connectDatabase } from "./config/database";
import { config } from "./config/env";
import { logger } from "./config/logger";
import { seedEmployees } from "./scripts/seed-data";

async function bootstrap() {
  await connectDatabase();
  if (config.seedOnStart) {
    await seedEmployees();
  }

  const app = createApp();
  const server = http.createServer(app);

  server.listen(config.port, () => {
    logger.info({ port: config.port }, "EMS API listening");
  });

  const shutdown = async () => {
    logger.info("Shutting down EMS API");
    server.close(async () => {
      await closeDatabase();
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

bootstrap().catch((error) => {
  logger.error({ error }, "Failed to start EMS API");
  process.exit(1);
});
