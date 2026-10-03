import { fakerES as faker } from "@faker-js/faker";
import { roundTo2 } from "../../../shared/utils/numbers";
import { CollectionsRepository } from "../collections/collections.repository";
import { MaterialLotsRepository } from "../material-lots/material-lots.repository";
import { MaterialsRepository } from "../materials/materials.repository";
import { WeighingsRepository } from "./weighings.repository";
import { WeighingsService } from "./weighings.service";

// Idempotent: inserts weighings only when the table is empty. Goes through WeighingsService so every
// weighing with a lot also raises that lot's stock, exactly as the API would.
export class WeighingsSeeder {
  constructor(
    private readonly service: WeighingsService = new WeighingsService(),
    private readonly repository: WeighingsRepository = new WeighingsRepository(),
    private readonly collectionsRepository: CollectionsRepository = new CollectionsRepository(),
    private readonly lotsRepository: MaterialLotsRepository = new MaterialLotsRepository(),
    private readonly materialsRepository: MaterialsRepository = new MaterialsRepository()
  ) {}

  async run(count: number): Promise<number> {
    if (count <= 0) return 0;

    const existing = await this.repository.count();
    if (existing > 0) {
      console.log(`⏭️  weighings: ${existing} row(s) already present, skipping`);
      return 0;
    }

    const [collections, lots, materials] = await Promise.all([
      this.collectionsRepository.findAllActive(),
      this.lotsRepository.findAllActive(),
      this.materialsRepository.findAllActive(),
    ]);
    if (collections.length === 0 || materials.length === 0) {
      console.log("⚠️  weighings: needs active collections and materials, skipping (seed them first)");
      return 0;
    }

    let inserted = 0;
    let withLot = 0;
    for (let i = 0; i < count; i++) {
      const collection = faker.helpers.arrayElement(collections);
      // ~75 % go into a lot (raising its stock); the rest are weighed without a lot assigned yet.
      const lot = lots.length > 0 && faker.datatype.boolean({ probability: 0.75 }) ? faker.helpers.arrayElement(lots) : null;
      const materialId = lot ? lot.materialId : faker.helpers.arrayElement(materials).id;
      const materialName = lot?.material?.name ?? materials.find((m) => m.id === materialId)!.name;
      const grossWeightKg = faker.number.float({ min: 20, max: 300, fractionDigits: 2 });
      const tareWeightKg = roundTo2(grossWeightKg * faker.number.float({ min: 0, max: 0.05 }));

      await this.service.create({
        name: `Pesaje ${materialName} ${collection.collectionDate}`,
        description: lot ? `Ingreso al lote ${lot.name}` : "Pendiente de asignar a un lote",
        collectionId: collection.id,
        materialId,
        materialLotId: lot?.id ?? null,
        grossWeightKg,
        tareWeightKg,
      });
      inserted++;
      if (lot) withLot++;
    }

    console.log(`✅ weighings: inserted ${inserted} row(s) (${withLot} added to lot stock)`);
    return inserted;
  }
}
