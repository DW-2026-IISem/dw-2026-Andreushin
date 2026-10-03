import { CreationAttributes } from "sequelize";
import { withTransaction } from "../../../shared/database/with-transaction";
import { Material } from "./material.model";
import { MaterialsRepository } from "./materials.repository";

// Real recyclables bought in La Guajira; a catalog makes no sense with random names.
const CATALOG: { name: string; description: string }[] = [
  { name: "Plástico PET", description: "Botellas de bebidas y envases transparentes (código 1)" },
  { name: "Plástico PEAD", description: "Envases de detergente, galones y tapas (código 2)" },
  { name: "Cartón", description: "Cajas corrugadas y empaques de cartón" },
  { name: "Papel archivo", description: "Papel blanco de oficina, cuadernos y hojas impresas" },
  { name: "Vidrio", description: "Botellas y frascos de vidrio de cualquier color" },
  { name: "Aluminio", description: "Latas de bebidas, perfiles y piezas de aluminio" },
  { name: "Cobre", description: "Cable pelado y piezas de cobre" },
  { name: "Chatarra", description: "Hierro y acero (metal ferroso)" },
  { name: "Plegadiza", description: "Cartulina de empaques de alimentos y medicamentos" },
  { name: "Tetra Pak", description: "Envases multicapa de leche y jugos" },
];

// Idempotent: inserts the catalog only when the table is empty.
export class MaterialsSeeder {
  constructor(private readonly repository: MaterialsRepository = new MaterialsRepository()) {}

  async run(count: number): Promise<number> {
    if (count <= 0) return 0;

    const existing = await this.repository.count();
    if (existing > 0) {
      console.log(`⏭️  materials: ${existing} row(s) already present, skipping`);
      return 0;
    }

    const rows: CreationAttributes<Material>[] = CATALOG.slice(0, count).map((item) => ({
      ...item,
      status: "active" as const,
    }));
    await withTransaction((transaction) => this.repository.bulkCreate(rows, transaction));
    console.log(`✅ materials: inserted ${rows.length} catalog row(s)`);
    return rows.length;
  }
}
