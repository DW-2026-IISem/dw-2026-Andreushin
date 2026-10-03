import { fakerES as faker } from "@faker-js/faker";
import { CreationAttributes } from "sequelize";
import { withTransaction } from "../../../shared/database/with-transaction";
import { RoutesRepository } from "../routes/routes.repository";
import { CollectionPoint } from "./collection-point.model";
import { CollectionPointsRepository } from "./collection-points.repository";

const PLACES = [
  "Parque Principal", "Plaza de Mercado", "Terminal de Transporte", "Colegio", "Hospital", "Iglesia",
  "Estadio", "Malecón", "Centro Comercial", "Ranchería", "Puerto", "Alcaldía", "Barrio Nuevo", "Cancha",
];

// Idempotent: inserts fake collection points only when the table is empty; needs active routes.
export class CollectionPointsSeeder {
  constructor(
    private readonly repository: CollectionPointsRepository = new CollectionPointsRepository(),
    private readonly routesRepository: RoutesRepository = new RoutesRepository()
  ) {}

  async run(count: number): Promise<number> {
    if (count <= 0) return 0;

    const existing = await this.repository.count();
    if (existing > 0) {
      console.log(`⏭️  collection_points: ${existing} row(s) already present, skipping`);
      return 0;
    }

    const routes = await this.routesRepository.findAllActive();
    if (routes.length === 0) {
      console.log("⚠️  collection_points: no active routes, skipping (seed routes first)");
      return 0;
    }

    // (name, routeId) must be unique, so pick from every combination without repeats.
    const combinations = routes.flatMap((route) => PLACES.map((place) => ({ route, place })));
    const picked = faker.helpers.arrayElements(combinations, Math.min(count, combinations.length));

    const rows: CreationAttributes<CollectionPoint>[] = picked.map(({ route, place }) => ({
      name: `Punto ${place}`,
      routeId: route.id,
      address: `${faker.location.streetAddress()}, ${route.municipality}`,
      description: `Punto de acopio de la ${route.name.toLowerCase()} (${route.municipality})`,
      status: faker.helpers.weightedArrayElement([
        { weight: 9, value: "active" as const },
        { weight: 1, value: "inactive" as const },
      ]),
    }));

    await withTransaction((transaction) => this.repository.bulkCreate(rows, transaction));
    console.log(`✅ collection_points: inserted ${rows.length} fake row(s) across ${routes.length} route(s)`);
    return rows.length;
  }
}
