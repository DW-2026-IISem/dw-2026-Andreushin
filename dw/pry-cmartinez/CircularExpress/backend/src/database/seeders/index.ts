import { sequelize, syncDatabase, testConnection } from "../db";
import "../models";
import { RecyclersSeeder } from "../../features/business/recyclers/recyclers.seeder";
import { RoutesSeeder } from "../../features/business/routes/routes.seeder";
import { CollectionPointsSeeder } from "../../features/business/collection-points/collection-points.seeder";
import { CollectionsSeeder } from "../../features/business/collections/collections.seeder";
import { MaterialsSeeder } from "../../features/business/materials/materials.seeder";
import { MaterialRatesSeeder } from "../../features/business/material-rates/material-rates.seeder";
import { PlantsSeeder } from "../../features/business/plants/plants.seeder";
import { MaterialLotsSeeder } from "../../features/business/material-lots/material-lots.seeder";
import { WeighingsSeeder } from "../../features/business/weighings/weighings.seeder";
import { MaterialSalesSeeder } from "../../features/business/material-sales/material-sales.seeder";
import { SettlementsSeeder } from "../../features/business/settlements/settlements.seeder";
import { resolveSeedCounts, SeedCounts } from "./counts";

// Runs every feature seeder in foreign-key order.
// Usage: npm run db:seed [-- --recyclers=25] [-- --fresh]   (--fresh drops and recreates the 11 tables first)
export class SeedersRunner {
  constructor(
    private readonly counts: SeedCounts = resolveSeedCounts(),
    private readonly fresh: boolean = process.argv.includes("--fresh")
  ) {}

  async run(): Promise<void> {
    console.log("🌱 Starting CircularGuajira SeedersRunner...");
    const connected = await testConnection();
    if (!connected) {
      throw new Error("No database connection");
    }
    if (this.fresh) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("--fresh is not allowed with NODE_ENV=production");
      }
      // Drops in reverse foreign-key order, then syncDatabase() recreates everything.
      await sequelize.drop();
      console.log("🗑️  --fresh: all tables dropped");
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
      materialLots: await new MaterialLotsSeeder().run(this.counts.materialLots),
      weighings: await new WeighingsSeeder().run(this.counts.weighings),
      materialSales: await new MaterialSalesSeeder().run(this.counts.materialSales),
      settlements: await new SettlementsSeeder().run(this.counts.settlements),
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
