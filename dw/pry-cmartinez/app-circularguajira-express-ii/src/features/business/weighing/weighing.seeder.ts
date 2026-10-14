import { fakerES as faker } from "@faker-js/faker";
import { Op } from "sequelize";
import { sequelize } from "../../../database/db";
import { Collection } from "./collection.model";
import { Weighing, WeighingCreationAttributes } from "./weighing.model";
import { Recycler } from "../collectors/recycler.model";
import { Route } from "../routes/route.model";
import { Material } from "../materials/material.model";
import { MaterialRate } from "../materials/material-rate.model";
import { todayInColombia } from "../materials/material-rates.service";
import { calculateLine, sumLines } from "./weighing.calculator";

/**
 * Collection + weighing seeder (dev data). Invoked from `src/database/seeders`.
 *
 * Scripts write through the models, so the service rules are replicated here: active
 * recycler, route and material, the rate whose period contains the collection date, and
 * totals from the shared calculator (the same formula the API uses). One transaction
 * per collection.
 */

const daysAgo = (days: number): string => {
  const date = new Date(`${todayInColombia()}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
};

const applicableRate = (materialId: number, date: string): Promise<MaterialRate | null> =>
  MaterialRate.findOne({
    where: {
      materialId,
      validFrom: { [Op.lte]: date },
      [Op.or]: [{ validTo: null }, { validTo: { [Op.gte]: date } }],
    },
  });

// `count` is the target total of collections; each new one gets up to `perCollection` weighings.
export async function seedCollections(count: number, perCollection: number): Promise<number> {
  const existing = await Collection.count();
  const missing = count - existing;
  if (missing <= 0 || perCollection <= 0) {
    console.log(`⏭️  collections: ${existing} row(s) already present (target ${count}), skipped`);
    return 0;
  }
  const [recyclers, routes, materials] = await Promise.all([
    Recycler.findAll({ where: { status: "active" } }),
    Route.findAll({ where: { status: "active" } }),
    Material.findAll({ where: { status: "active" } }),
  ]);
  if (recyclers.length === 0 || routes.length === 0 || materials.length === 0) {
    console.log("⏭️  collections: missing active recyclers, routes or materials, skipped");
    return 0;
  }

  let created = 0;
  let weighingsCreated = 0;
  for (let i = 0; i < missing; i++) {
    const collectedOn = daysAgo(faker.number.int({ min: 0, max: 25 }));
    const picked = faker.helpers.arrayElements(materials, Math.min(perCollection, materials.length));

    const lines: Omit<WeighingCreationAttributes, "collectionId">[] = [];
    for (const material of picked) {
      const rate = await applicableRate(material.id, collectedOn);
      if (!rate) continue;
      const grossKg = faker.number.float({ min: 5, max: 80, fractionDigits: 2 });
      const tareKg = faker.number.float({ min: 0.5, max: 3, fractionDigits: 2 });
      lines.push({
        materialId: material.id,
        rateId: rate.id,
        pricePerKg: rate.pricePerKg,
        grossKg,
        tareKg,
        ...calculateLine(grossKg, tareKg, rate.pricePerKg),
        status: "active",
      });
    }
    if (lines.length === 0) continue;

    const totals = sumLines(lines);
    await sequelize.transaction(async (transaction) => {
      const collection = await Collection.create(
        {
          recyclerId: faker.helpers.arrayElement(recyclers).id,
          routeId: faker.helpers.arrayElement(routes).id,
          collectedOn,
          totalNetKg: totals.totalNetKg,
          totalAmount: totals.totalAmount,
          status: "active",
        },
        { transaction }
      );
      await Weighing.bulkCreate(
        lines.map((line) => ({ ...line, collectionId: collection.id })),
        { transaction }
      );
    });
    created += 1;
    weighingsCreated += lines.length;
  }
  console.log(`✅ collections: inserted ${created} collection(s) with ${weighingsCreated} weighing(s)`);
  return created;
}
