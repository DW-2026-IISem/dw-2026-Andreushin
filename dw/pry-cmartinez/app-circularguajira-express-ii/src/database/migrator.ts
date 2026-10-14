import path from "node:path";
import { QueryInterface } from "sequelize";
import { SequelizeStorage, Umzug } from "umzug";
import { sequelize } from "./db";

/**
 * Versioned schema: every table comes from a migration in ./migrations (one per ISS),
 * never from sequelize.sync(). Executed migrations are recorded in SequelizeMeta.
 */
export const migrator = new Umzug<QueryInterface>({
  migrations: {
    glob: path.join(__dirname, "migrations/*.{ts,js}").replace(/\\/g, "/"),
    // Name without extension: the same migration is .ts under ts-node and .js in dist/.
    resolve: (params) => ({ ...Umzug.defaultResolver(params), name: params.name.replace(/\.(ts|js)$/, "") }),
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

export type Migration = typeof migrator._types.migration;

// The App, the seeders and the tests refuse to run on an outdated schema.
export const assertNoPendingMigrations = async (): Promise<void> => {
  const pending = await migrator.pending();
  if (pending.length > 0) {
    throw new Error(
      `Pending migrations: ${pending.map((m) => m.name).join(", ")}. Run npm run db:migrate`
    );
  }
};
