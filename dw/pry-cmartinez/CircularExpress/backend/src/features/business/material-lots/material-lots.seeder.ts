import { fakerES as faker } from "@faker-js/faker";
import { CreationAttributes } from "sequelize";
import { withTransaction } from "../../../shared/database/with-transaction";
import { todayInBusinessZone } from "../../../shared/utils/dates";
import { MaterialsRepository } from "../materials/materials.repository";
import { PlantsRepository } from "../plants/plants.repository";
import { MaterialLot } from "./material-lot.model";
import { MaterialLotsRepository } from "./material-lots.repository";

// 3-letter code without accents from the first or last word: "San Juan del Cesar" -> "SAN", "Plástico PET" -> "PET".
const codeOf = (text: string, word: "first" | "last"): string => {
  const words = text.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().split(/\s+/);
  return (word === "first" ? words[0] : words[words.length - 1]).slice(0, 3);
};

// Idempotent: inserts lots only when the table is empty; needs active plants and materials.
export class MaterialLotsSeeder {
  constructor(
    private readonly repository: MaterialLotsRepository = new MaterialLotsRepository(),
    private readonly plantsRepository: PlantsRepository = new PlantsRepository(),
    private readonly materialsRepository: MaterialsRepository = new MaterialsRepository()
  ) {}

  async run(count: number): Promise<number> {
    if (count <= 0) return 0;

    const existing = await this.repository.count();
    if (existing > 0) {
      console.log(`⏭️  material_lots: ${existing} row(s) already present, skipping`);
      return 0;
    }

    const [plants, materials] = await Promise.all([
      this.plantsRepository.findAllActive(),
      this.materialsRepository.findAllActive(),
    ]);
    if (plants.length === 0 || materials.length === 0) {
      console.log("⚠️  material_lots: needs active plants and materials, skipping (seed them first)");
      return 0;
    }

    // One lot per (plant, material) combination at most; lot codes are unique.
    const combinations = plants.flatMap((plant) => materials.map((material) => ({ plant, material })));
    const picked = faker.helpers.arrayElements(combinations, Math.min(count, combinations.length));
    const yearMonth = todayInBusinessZone().slice(0, 7).replace("-", "");

    const rows: CreationAttributes<MaterialLot>[] = picked.map(({ plant, material }, index) => ({
      name: `LT-${codeOf(plant.municipality, "first")}-${codeOf(material.name, "last")}-${yearMonth}-${String(index + 1).padStart(3, "0")}`,
      description: `${material.name} clasificado en ${plant.name}`,
      weightKg: faker.number.float({ min: 50, max: 2000, fractionDigits: 2 }),
      plantId: plant.id,
      materialId: material.id,
      status: "active" as const,
    }));

    await withTransaction((transaction) => this.repository.bulkCreate(rows, transaction));
    console.log(`✅ material_lots: inserted ${rows.length} row(s) across ${plants.length} plant(s)`);
    return rows.length;
  }
}
