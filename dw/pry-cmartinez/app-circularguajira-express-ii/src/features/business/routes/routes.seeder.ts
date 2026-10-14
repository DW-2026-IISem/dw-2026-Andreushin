import { fakerES as faker } from "@faker-js/faker";
import { Route } from "./route.model";
import { CollectionPoint, CollectionPointCreationAttributes } from "./collection-point.model";

/**
 * Route and collection point seeders (dev data). Invoked from `src/database/seeders`.
 *
 * Scripts write through the models directly, so the membership rules of the services are
 * replicated here: points only on active routes and a unique, consecutive visit order.
 */

// Collection routes across La Guajira municipalities.
const CATALOG: ReadonlyArray<{ name: string; municipality: string; description: string }> = [
  { name: "Riohacha Centro", municipality: "Riohacha", description: "Centro histórico y malecón" },
  { name: "Riohacha Sur", municipality: "Riohacha", description: "Barrios del sur y zona de mercado" },
  { name: "Maicao Comercial", municipality: "Maicao", description: "Zona comercial y bodegas" },
  { name: "Uribia Casco Urbano", municipality: "Uribia", description: "Casco urbano y terminal" },
  { name: "Manaure Salinas", municipality: "Manaure", description: "Zona de salinas y puerto" },
  { name: "Fonseca Centro", municipality: "Fonseca", description: "Centro y plaza principal" },
  { name: "San Juan del Cesar", municipality: "San Juan del Cesar", description: "Casco urbano" },
  { name: "Albania Minera", municipality: "Albania", description: "Área urbana y campamentos" },
];

const POINT_KINDS = ["Tienda", "Conjunto", "Colegio", "Restaurante", "Supermercado", "Taller", "Parroquia"];

// `count` is the target total (capped by the catalog); only missing names are inserted.
export async function seedRoutes(count: number): Promise<number> {
  const existing = new Set((await Route.findAll({ attributes: ["name"] })).map((r) => r.name));
  const target = Math.min(count, CATALOG.length);
  const missing = CATALOG.filter((item) => !existing.has(item.name)).slice(
    0,
    Math.max(target - existing.size, 0)
  );
  if (missing.length === 0) {
    console.log(`⏭️  routes: ${existing.size} row(s) already present (target ${target}), skipped`);
    return 0;
  }
  await Route.bulkCreate(missing.map((item) => ({ ...item, status: "active" as const })));
  console.log(`✅ routes: inserted ${missing.length} row(s) (total ${existing.size + missing.length})`);
  return missing.length;
}

// `perRoute` stops for every active route that has none yet, with visit order 1..perRoute.
export async function seedCollectionPoints(perRoute: number): Promise<number> {
  if (perRoute <= 0) {
    console.log("⏭️  collectionPoints: perRoute=0, skipped");
    return 0;
  }
  const routes = await Route.findAll({
    where: { status: "active" },
    include: [{ model: CollectionPoint, as: "points", attributes: ["id"] }],
  });
  const rows: CollectionPointCreationAttributes[] = [];
  for (const route of routes) {
    const points = route.get("points") as CollectionPoint[];
    if (points.length > 0) continue;
    for (let visitOrder = 1; visitOrder <= perRoute; visitOrder++) {
      rows.push({
        routeId: route.id,
        name: `${faker.helpers.arrayElement(POINT_KINDS)} ${faker.person.lastName()}`,
        address: `${faker.location.streetAddress()}, ${route.municipality}`,
        visitOrder,
        status: "active",
      });
    }
  }
  if (rows.length === 0) {
    console.log("⏭️  collectionPoints: every active route already has points, skipped");
    return 0;
  }
  await CollectionPoint.bulkCreate(rows);
  console.log(`✅ collectionPoints: inserted ${rows.length} point(s) (${perRoute} per route)`);
  return rows.length;
}
