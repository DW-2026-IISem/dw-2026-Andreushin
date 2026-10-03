import { fakerES as faker } from "@faker-js/faker";
import { CreationAttributes } from "sequelize";
import { withTransaction } from "../../../shared/database/with-transaction";
import { Route } from "./route.model";
import { RoutesRepository } from "./routes.repository";

const MUNICIPALITIES = ["Riohacha", "Maicao", "Uribia", "Manaure", "Fonseca", "San Juan del Cesar", "Albania", "Dibulla"];
const ZONES = ["Centro", "Norte", "Sur", "Oriente", "Occidente", "Malecón", "Zona Industrial", "Mercado", "Barrios Periféricos"];

// Idempotent: inserts fake collection routes only when the table is empty.
export class RoutesSeeder {
  constructor(private readonly repository: RoutesRepository = new RoutesRepository()) {}

  async run(count: number): Promise<number> {
    if (count <= 0) return 0;

    const existing = await this.repository.count();
    if (existing > 0) {
      console.log(`⏭️  routes: ${existing} row(s) already present, skipping`);
      return 0;
    }

    const rows = this.buildRows(count);
    await withTransaction((transaction) => this.repository.bulkCreate(rows, transaction));
    console.log(`✅ routes: inserted ${rows.length} fake row(s)`);
    return rows.length;
  }

  private buildRows(count: number): CreationAttributes<Route>[] {
    // (name, municipality) must be unique, so pick from every combination without repeats.
    const combinations = MUNICIPALITIES.flatMap((municipality) => ZONES.map((zone) => ({ municipality, zone })));
    const picked = faker.helpers.arrayElements(combinations, Math.min(count, combinations.length));

    return picked.map(({ municipality, zone }) => ({
      name: `Ruta ${zone}`,
      municipality,
      description: `Recorrido ${faker.helpers.arrayElement(["diario", "interdiario", "semanal"])} por el sector ${zone.toLowerCase()} de ${municipality}`,
      status: faker.helpers.weightedArrayElement([
        { weight: 9, value: "active" as const },
        { weight: 1, value: "inactive" as const },
      ]),
    }));
  }
}
