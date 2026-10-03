import { fakerES as faker } from "@faker-js/faker";
import { CreationAttributes } from "sequelize";
import { withTransaction } from "../../../shared/database/with-transaction";
import { daysBefore, todayInBusinessZone } from "../../../shared/utils/dates";
import { MaterialsRepository } from "../materials/materials.repository";
import { MaterialRate } from "./material-rate.model";
import { MaterialRatesRepository } from "./material-rates.repository";

// Reference buying prices in COP per kg; unknown materials fall back to DEFAULT_PRICE.
const REFERENCE_PRICES: Record<string, number> = {
  "Plástico PET": 1200,
  "Plástico PEAD": 1000,
  Cartón: 400,
  "Papel archivo": 650,
  Vidrio: 150,
  Aluminio: 4500,
  Cobre: 26000,
  Chatarra: 700,
  Plegadiza: 250,
  "Tetra Pak": 200,
};
const DEFAULT_PRICE = 500;

// Idempotent: inserts rates only when the table is empty. First a current (active) rate per material,
// then older (inactive) rates as history while `count` allows.
export class MaterialRatesSeeder {
  constructor(
    private readonly repository: MaterialRatesRepository = new MaterialRatesRepository(),
    private readonly materialsRepository: MaterialsRepository = new MaterialsRepository()
  ) {}

  async run(count: number): Promise<number> {
    if (count <= 0) return 0;

    const existing = await this.repository.count();
    if (existing > 0) {
      console.log(`⏭️  material_rates: ${existing} row(s) already present, skipping`);
      return 0;
    }

    const materials = await this.materialsRepository.findAllActive();
    if (materials.length === 0) {
      console.log("⚠️  material_rates: no active materials, skipping (seed materials first)");
      return 0;
    }

    const today = todayInBusinessZone();
    const rows: CreationAttributes<MaterialRate>[] = [];
    for (let i = 0; i < count; i++) {
      const material = materials[i % materials.length];
      const round = Math.floor(i / materials.length); // 0 = current, 1.. = older history
      const base = REFERENCE_PRICES[material.name] ?? DEFAULT_PRICE;
      // Older rates were a bit cheaper; current rates vary ±5 % around the reference.
      const factor = round === 0 ? faker.number.float({ min: 0.95, max: 1.05 }) : 1 - 0.07 * round;
      const validFrom = daysBefore(today, round === 0 ? faker.number.int({ min: 0, max: 30 }) : 30 + 45 * round);
      rows.push({
        name: `Tarifa ${material.name} ${validFrom.slice(0, 7)}`,
        description: round === 0 ? "Tarifa vigente de compra por kilo" : "Tarifa histórica",
        pricePerKg: Math.round(base * factor),
        validFrom,
        materialId: material.id,
        status: round === 0 ? "active" : "inactive",
      });
    }

    await withTransaction((transaction) => this.repository.bulkCreate(rows, transaction));
    const current = rows.filter((row) => row.status === "active").length;
    console.log(`✅ material_rates: inserted ${rows.length} row(s) (${current} current, ${rows.length - current} history)`);
    return rows.length;
  }
}
