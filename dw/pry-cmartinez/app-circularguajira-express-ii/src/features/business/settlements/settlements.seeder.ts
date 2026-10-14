import { Settlement } from "./settlement.model";
import { Collection } from "../weighing/collection.model";
import { Weighing } from "../weighing/weighing.model";
import { sumLines } from "../weighing/weighing.calculator";

/**
 * Settlement seeder (dev data). Invoked from `src/database/seeders` after the collections.
 *
 * Replicates `SettlementsService.create`: only active collections without settlements and
 * with active weighings; totals from the shared calculator. The seeded weighings already
 * carry the rate valid on their date, so no re-pricing is needed here.
 */
export async function seedSettlements(count: number): Promise<number> {
  const issued = await Settlement.count({ where: { status: "issued" } });
  const missing = count - issued;
  if (missing <= 0) {
    console.log(`⏭️  settlements: ${issued} issued already present (target ${count}), skipped`);
    return 0;
  }
  const candidates = await Collection.findAll({
    where: { status: "active" },
    include: [
      { model: Settlement, as: "settlements", attributes: ["id"] },
      { model: Weighing, as: "weighings", where: { status: "active" }, required: true },
    ],
    order: [["collectedOn", "ASC"]],
  });
  const open = candidates.filter((c) => (c.get("settlements") as Settlement[]).length === 0).slice(0, missing);
  for (const collection of open) {
    const totals = sumLines(collection.get("weighings") as Weighing[]);
    await Settlement.create({
      collectionId: collection.id,
      recyclerId: collection.recyclerId,
      settledAt: new Date(),
      ...totals,
      status: "issued",
      notes: "Liquidación generada por el seeder",
    });
  }
  console.log(`✅ settlements: issued ${open.length} settlement(s) (total ${issued + open.length})`);
  return open.length;
}
