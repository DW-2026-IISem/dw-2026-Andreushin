import { sequelize, syncDatabase, testConnection } from "../db";
import "../../features/business/recyclers/recycler.model";
import { RecyclersSeeder } from "../../features/business/recyclers/recyclers.seeder";
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
