import { fakerES as faker } from "@faker-js/faker";
import { CreationAttributes } from "sequelize";
import { withTransaction } from "../../../shared/database/with-transaction";
import { Plant } from "./plant.model";
import { PlantsRepository } from "./plants.repository";

// Plausible facilities across La Guajira; names must be unique.
const FACILITIES: { name: string; municipality: string; description: string }[] = [
  { name: "Planta de Clasificación Riohacha", municipality: "Riohacha", description: "Clasificación y compactación de plásticos y cartón" },
  { name: "Centro de Acopio Maicao", municipality: "Maicao", description: "Recepción y pesaje de material de recicladores de oficio" },
  { name: "Planta de Aprovechamiento Uribia", municipality: "Uribia", description: "Acopio de vidrio y metales de la alta Guajira" },
  { name: "Estación de Clasificación Manaure", municipality: "Manaure", description: "Separación de PET y aluminio" },
  { name: "Centro de Acopio Fonseca", municipality: "Fonseca", description: "Acopio regional del sur de La Guajira" },
  { name: "Bodega de Reciclaje San Juan del Cesar", municipality: "San Juan del Cesar", description: "Almacenamiento y venta de chatarra y cobre" },
];

// Idempotent: inserts plants only when the table is empty.
export class PlantsSeeder {
  constructor(private readonly repository: PlantsRepository = new PlantsRepository()) {}

  async run(count: number): Promise<number> {
    if (count <= 0) return 0;

    const existing = await this.repository.count();
    if (existing > 0) {
      console.log(`⏭️  plants: ${existing} row(s) already present, skipping`);
      return 0;
    }

    const rows: CreationAttributes<Plant>[] = FACILITIES.slice(0, count).map((facility) => ({
      ...facility,
      address: `${faker.location.streetAddress()}, ${facility.municipality}`,
      status: "active" as const,
    }));
    await withTransaction((transaction) => this.repository.bulkCreate(rows, transaction));
    console.log(`✅ plants: inserted ${rows.length} row(s)`);
    return rows.length;
  }
}
