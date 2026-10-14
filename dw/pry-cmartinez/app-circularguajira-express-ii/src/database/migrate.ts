import { migrator } from "./migrator";
import { sequelize } from "./db";

/**
 * Migration CLI (Umzug):
 *   npm run db:migrate          -> up (all pending)
 *   npm run db:migrate:undo     -> down (last executed)
 *   npm run db:migrate:status   -> pending
 *   npx ts-node src/database/migrate.ts executed
 */
migrator
  .runAsCLI()
  .then(() => sequelize.close())
  .catch(async (error: unknown) => {
    console.error("❌ Migration failed:", error);
    await sequelize.close();
    process.exit(1);
  });
