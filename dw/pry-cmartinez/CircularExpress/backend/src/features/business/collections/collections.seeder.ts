import { fakerES as faker } from "@faker-js/faker";
import { CreationAttributes } from "sequelize";
import { withTransaction } from "../../../shared/database/with-transaction";
import { daysBefore, todayInBusinessZone } from "../../../shared/utils/dates";
import { RecyclersRepository } from "../recyclers/recyclers.repository";
import { RoutesRepository } from "../routes/routes.repository";
import { Collection } from "./collection.model";
import { CollectionsRepository } from "./collections.repository";

const DAYS_BACK = 60;

// Idempotent: inserts fake workdays only when the table is empty; needs active recyclers and routes.
export class CollectionsSeeder {
  constructor(
    private readonly repository: CollectionsRepository = new CollectionsRepository(),
    private readonly recyclersRepository: RecyclersRepository = new RecyclersRepository(),
    private readonly routesRepository: RoutesRepository = new RoutesRepository()
  ) {}

  async run(count: number): Promise<number> {
    if (count <= 0) return 0;

    const existing = await this.repository.count();
    if (existing > 0) {
      console.log(`⏭️  collections: ${existing} row(s) already present, skipping`);
      return 0;
    }

    const [recyclers, routes] = await Promise.all([
      this.recyclersRepository.findAllActive(),
      this.routesRepository.findAllActive(),
    ]);
    if (recyclers.length === 0 || routes.length === 0) {
      console.log("⚠️  collections: needs active recyclers and routes, skipping (seed them first)");
      return 0;
    }

    // (recyclerId, routeId, collectionDate) must be unique: keep a set of used keys.
    const today = todayInBusinessZone();
    const used = new Set<string>();
    const rows: CreationAttributes<Collection>[] = [];
    const maxAttempts = count * 20;
    for (let attempt = 0; rows.length < count && attempt < maxAttempts; attempt++) {
      const recycler = faker.helpers.arrayElement(recyclers);
      const route = faker.helpers.arrayElement(routes);
      const collectionDate = daysBefore(today, faker.number.int({ min: 0, max: DAYS_BACK }));
      const key = `${recycler.id}|${route.id}|${collectionDate}`;
      if (used.has(key)) continue;
      used.add(key);
      rows.push({
        name: `Jornada ${route.name} ${collectionDate}`,
        description: `${recycler.name} recorre la ${route.name.toLowerCase()} de ${route.municipality}`,
        collectionDate,
        recyclerId: recycler.id,
        routeId: route.id,
        status: faker.helpers.weightedArrayElement([
          { weight: 9, value: "active" as const },
          { weight: 1, value: "inactive" as const },
        ]),
      });
    }

    await withTransaction((transaction) => this.repository.bulkCreate(rows, transaction));
    console.log(`✅ collections: inserted ${rows.length} fake row(s) (last ${DAYS_BACK} days)`);
    return rows.length;
  }
}
