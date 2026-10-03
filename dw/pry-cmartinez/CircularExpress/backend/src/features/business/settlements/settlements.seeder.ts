import { fakerES as faker } from "@faker-js/faker";
import { daysBefore, todayInBusinessZone } from "../../../shared/utils/dates";
import { RecyclersRepository } from "../recyclers/recyclers.repository";
import { WeighingsRepository } from "../weighings/weighings.repository";
import { SettlementsRepository } from "./settlements.repository";
import { SettlementsService } from "./settlements.service";

const PERIOD_DAYS = 60; // matches the collections seeder window

// Idempotent: inserts settlements only when the table is empty. Goes through SettlementsService so amounts are
// computed from real weighings and rates; one settlement per recycler that has weighings in the period, then
// moved along the workflow (pending / approved / paid).
export class SettlementsSeeder {
  constructor(
    private readonly service: SettlementsService = new SettlementsService(),
    private readonly repository: SettlementsRepository = new SettlementsRepository(),
    private readonly recyclersRepository: RecyclersRepository = new RecyclersRepository(),
    private readonly weighingsRepository: WeighingsRepository = new WeighingsRepository()
  ) {}

  async run(count: number): Promise<number> {
    if (count <= 0) return 0;

    const existing = await this.repository.count();
    if (existing > 0) {
      console.log(`⏭️  settlements: ${existing} row(s) already present, skipping`);
      return 0;
    }

    const periodEnd = todayInBusinessZone();
    const periodStart = daysBefore(periodEnd, PERIOD_DAYS);
    const recyclers = await this.recyclersRepository.findAllActive();
    const states: Record<string, number> = { pending: 0, approved: 0, paid: 0 };
    let inserted = 0;

    for (const recycler of recyclers) {
      if (inserted >= count) break;
      const weighings = await this.weighingsRepository.findActiveForRecyclerInPeriod(recycler.id, periodStart, periodEnd);
      if (weighings.length === 0) continue;

      const settlement = await this.service.create({
        recyclerId: recycler.id,
        periodStart,
        periodEnd,
        observations: `Liquidación de los últimos ${PERIOD_DAYS} días`,
      });
      const target = faker.helpers.weightedArrayElement([
        { weight: 4, value: "pending" },
        { weight: 3, value: "approved" },
        { weight: 3, value: "paid" },
      ]);
      if (target !== "pending") await this.service.patch(settlement.id, { state: "approved" });
      if (target === "paid") await this.service.patch(settlement.id, { state: "paid" });
      states[target]++;
      inserted++;
    }

    console.log(
      `✅ settlements: inserted ${inserted} row(s) (${states.pending} pending, ${states.approved} approved, ${states.paid} paid)`
    );
    return inserted;
  }
}
