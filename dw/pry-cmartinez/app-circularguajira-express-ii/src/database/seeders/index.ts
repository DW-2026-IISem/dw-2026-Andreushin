import dotenv from "dotenv";
import { sequelize, testConnection } from "../db";
import { assertNoPendingMigrations } from "../migrator";
import { seedRecyclers } from "../../features/business/collectors/recyclers.seeder";
import "../../features/business/materials/materials.associations";
import { seedMaterialRates, seedMaterials } from "../../features/business/materials/materials.seeder";
import "../../features/business/routes/routes.associations";
import { seedCollectionPoints, seedRoutes } from "../../features/business/routes/routes.seeder";
import "../../features/business/weighing/weighing.associations";
import "../../features/business/settlements/settlements.associations";
import "../../features/auth/rbac.associations";
import { seedUsers } from "../../features/auth/users/users.seeder";
import { seedRoles } from "../../features/auth/roles/roles.seeder";
import { seedResources } from "../../features/auth/resources/resources.seeder";
import { seedRoleUsers } from "../../features/auth/role-users/role-users.seeder";
import { seedResourceRoles } from "../../features/auth/resource-roles/resource-roles.seeder";
import { seedCollections } from "../../features/business/weighing/weighing.seeder";
import { seedSettlements } from "../../features/business/settlements/settlements.seeder";
import { resolveSeedCounts } from "./counts";

dotenv.config();

/**
 * SeedersRunner: runs every feature seeder.
 *
 * Lives in `src/database/seeders/` (orchestration outside the features); each feature
 * exports its own seeder (e.g. `features/business/collectors/recyclers.seeder.ts`).
 *
 * Usage:
 *   npm run db:seed
 *   npm run db:seed -- --recyclers=20
 *   SEED_RECYCLERS=5 npm run db:seed
 *   npm run db:seed -- --materials=6 --materialRates=4
 *   npm run db:seed -- --routes=8 --collectionPoints=5
 *   npm run db:seed -- --collections=12 --weighings=4 --settlements=6
 */
export async function runAllSeeders(): Promise<void> {
  const counts = resolveSeedCounts();
  console.log("🌱 SeedersRunner starting...");
  console.log("📊 Counts:", counts);

  const connected = await testConnection();
  if (!connected) {
    throw new Error("Database connection failed");
  }

  // The seeders never change the schema: it must be migrated first.
  await assertNoPendingMigrations();

  // Security first, so the system is operable right away (canonical users with their
  // roles and the full RBAC matrix): roles -> resources -> users -> role_users -> resource_roles.
  // Roles and resources are deterministic catalogs (no counts) and reconcile on every run.
  await seedRoles();
  await seedResources();
  await seedUsers(counts.users);
  await seedRoleUsers();
  await seedResourceRoles();

  // Business: parents -> children.
  await seedRecyclers(counts.recyclers);
  await seedMaterials(counts.materials);
  await seedMaterialRates(counts.materialRates);
  await seedRoutes(counts.routes);
  await seedCollectionPoints(counts.collectionPoints);
  await seedCollections(counts.collections, counts.weighings);
  await seedSettlements(counts.settlements);

  console.log("🌱 SeedersRunner finished");
}

if (require.main === module) {
  runAllSeeders()
    .then(async () => {
      await sequelize.close();
      process.exit(0);
    })
    .catch(async (error: unknown) => {
      console.error("❌ Seeders failed:", error);
      await sequelize.close();
      process.exit(1);
    });
}
