import { sequelize, syncDatabase, testConnection } from "../db";
import "../../features/business/recyclers/recycler.model";
import "../../features/business/routes/route.model";
import "../../features/business/collection-points/collection-point.model";
import "../../features/business/collections/collection.model";
import "../../features/business/materials/material.model";
import "../../features/business/material-rates/material-rate.model";
import "../../features/business/plants/plant.model";
import "../../features/business/collection-points/collection-points.associations";
import "../../features/business/collections/collections.associations";
import "../../features/business/material-rates/material-rates.associations";
import { RecyclersSeeder } from "../../features/business/recyclers/recyclers.seeder";
import { RoutesSeeder } from "../../features/business/routes/routes.seeder";
import { CollectionPointsSeeder } from "../../features/business/collection-points/collection-points.seeder";
import { CollectionsSeeder } from "../../features/business/collections/collections.seeder";
import { MaterialsSeeder } from "../../features/business/materials/materials.seeder";
import { MaterialRatesSeeder } from "../../features/business/material-rates/material-rates.seeder";
import { PlantsSeeder } from "../../features/business/plants/plants.seeder";
import { resolveSeedCounts, SeedCounts } from "./counts";

// Runs every feature seeder in foreign-key order. Usage: npm run db:seed [-- --recyclers=25]
export class SeedersRunner {
  constructor(private readonly counts: SeedCounts = resolveSeedCounts()) {}

  async run(): Promise<void> {
    console.log("🌱 Starting CircularGuajira SeedersRunner...");
    const connected = await testConnection();
    if (!connected) {
      throw new Error("No database connection");
    }
    await syncDatabase();

    const summary: Record<string, number> = {
      recyclers: await new RecyclersSeeder().run(this.counts.recyclers),
      routes: await new RoutesSeeder().run(this.counts.routes),
      collectionPoints: await new CollectionPointsSeeder().run(this.counts.collectionPoints),
      collections: await new CollectionsSeeder().run(this.counts.collections),
      materials: await new MaterialsSeeder().run(this.counts.materials),
      materialRates: await new MaterialRatesSeeder().run(this.counts.materialRates),
      plants: await new PlantsSeeder().run(this.counts.plants),
    };

    console.table(summary);
    console.log("🌱 SeedersRunner finished");
  }
}

if (require.main === module) {
  new SeedersRunner()
    .run()
    .then(async () => {
      await sequelize.close();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error("❌ Seeders failed:", error);
      await sequelize.close();
      process.exit(1);
    });
}
