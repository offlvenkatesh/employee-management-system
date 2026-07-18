import { closeDatabase, connectDatabase } from "../config/database";
import { logger } from "../config/logger";
import { seedEmployees } from "./seed-data";

async function main() {
  await connectDatabase();
  await seedEmployees();
  await closeDatabase();
}

main().catch((error) => {
  logger.error({ error }, "Seed failed");
  process.exit(1);
});
