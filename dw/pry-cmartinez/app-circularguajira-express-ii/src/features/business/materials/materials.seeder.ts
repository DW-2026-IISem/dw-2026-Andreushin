import { fakerES as faker } from "@faker-js/faker";
import { Material } from "./material.model";
import { MaterialRate, MaterialRateCreationAttributes } from "./material-rate.model";

/**
 * Material and rate seeders (dev data). Invoked from `src/database/seeders`, never from the App.
 *
 * Scripts write through the models directly, so the rate rule of
 * `material-rates.service.ts` is replicated here: consecutive, non-overlapping monthly
 * periods and only the latest one open-ended.
 */

// Real recycling catalog with a reference price per kg (COP).
const CATALOG: ReadonlyArray<{ name: string; description: string; basePrice: number }> = [
  { name: "PET", description: "Botellas y envases plásticos transparentes", basePrice: 1200 },
  { name: "Cartón", description: "Cajas y láminas de cartón corrugado", basePrice: 450 },
  { name: "Archivo", description: "Papel blanco de oficina", basePrice: 700 },
  { name: "Plegadiza", description: "Cartulina de empaques (cajas de cereal, medicamentos)", basePrice: 250 },
  { name: "Vidrio", description: "Botellas y frascos de vidrio", basePrice: 150 },
  { name: "Aluminio", description: "Latas y perfiles de aluminio", basePrice: 4500 },
  { name: "Chatarra", description: "Hierro y acero", basePrice: 900 },
  { name: "Polietileno", description: "Bolsas y películas plásticas (PEBD)", basePrice: 600 },
  { name: "Cobre", description: "Cable y tubería de cobre", basePrice: 28000 },
  { name: "Tetra Pak", description: "Envases de cartón para bebidas", basePrice: 200 },
];

const firstOfMonth = (monthsAgo: number): Date => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, 1));
};
const isoDate = (date: Date): string => date.toISOString().slice(0, 10);

// `count` is the target total (capped by the catalog); only missing names are inserted.
export async function seedMaterials(count: number): Promise<number> {
  const existing = new Set((await Material.findAll({ attributes: ["name"] })).map((m) => m.name));
  const target = Math.min(count, CATALOG.length);
  const missing = CATALOG.filter((item) => !existing.has(item.name)).slice(
    0,
    Math.max(target - existing.size, 0)
  );
  if (missing.length === 0) {
    console.log(`⏭️  materials: ${existing.size} row(s) already present (target ${target}), skipped`);
    return 0;
  }
  await Material.bulkCreate(
    missing.map((item) => ({ name: item.name, description: item.description, status: "active" as const }))
  );
  console.log(`✅ materials: inserted ${missing.length} row(s) (total ${existing.size + missing.length})`);
  return missing.length;
}

// `periods` monthly rates per material; materials that already have rates are skipped.
export async function seedMaterialRates(periods: number): Promise<number> {
  if (periods <= 0) {
    console.log("⏭️  materialRates: periods=0, skipped");
    return 0;
  }
  const materials = await Material.findAll({
    include: [{ model: MaterialRate, as: "rates", attributes: ["id"] }],
  });
  const rows: MaterialRateCreationAttributes[] = [];
  for (const material of materials) {
    const rates = material.get("rates") as MaterialRate[];
    if (rates.length > 0) continue;
    const basePrice = CATALOG.find((item) => item.name === material.name)?.basePrice ?? 500;
    for (let monthsAgo = periods - 1; monthsAgo >= 0; monthsAgo--) {
      const variation = faker.number.float({ min: -0.15, max: 0.15 });
      rows.push({
        materialId: material.id,
        pricePerKg: Math.round((basePrice * (1 + variation)) / 10) * 10,
        validFrom: isoDate(firstOfMonth(monthsAgo)),
        // Closed on the last day of its month, except the current (latest) period.
        validTo: monthsAgo === 0 ? null : isoDate(new Date(firstOfMonth(monthsAgo - 1).getTime() - 86_400_000)),
      });
    }
  }
  if (rows.length === 0) {
    console.log("⏭️  materialRates: every material already has rates, skipped");
    return 0;
  }
  await MaterialRate.bulkCreate(rows);
  console.log(`✅ materialRates: inserted ${rows.length} rate(s) (${periods} period(s) per material)`);
  return rows.length;
}
