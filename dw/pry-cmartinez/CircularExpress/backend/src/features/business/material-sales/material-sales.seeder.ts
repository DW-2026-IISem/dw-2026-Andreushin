import { fakerES as faker } from "@faker-js/faker";
import { daysBefore, todayInBusinessZone } from "../../../shared/utils/dates";
import { roundTo2 } from "../../../shared/utils/numbers";
import { MaterialLotsRepository } from "../material-lots/material-lots.repository";
import { MaterialRatesRepository } from "../material-rates/material-rates.repository";
import { MaterialSalesRepository } from "./material-sales.repository";
import { MaterialSalesService } from "./material-sales.service";

// Fictitious processors that buy recyclables from La Guajira.
const BUYERS = [
  "Transformadora Plástica del Caribe S.A.S.",
  "Papeles Reciclados de la Costa S.A.S.",
  "Fundición Metálica del Norte Ltda.",
  "Vidriera Industrial del Atlántico S.A.",
  "Recuperadora de Metales La Sierra S.A.S.",
];
const DEFAULT_RATE = 500; // COP/kg when a material has no current rate
const MIN_STOCK_KG = 20;

// Idempotent: inserts sales only when the table is empty. Goes through MaterialSalesService so every sale
// removes its quantity from the lot, exactly as the API would. Sells 10–40 % of a lot's current stock at
// the material's current rate plus a 20–50 % resale margin.
export class MaterialSalesSeeder {
  constructor(
    private readonly service: MaterialSalesService = new MaterialSalesService(),
    private readonly repository: MaterialSalesRepository = new MaterialSalesRepository(),
    private readonly lotsRepository: MaterialLotsRepository = new MaterialLotsRepository(),
    private readonly ratesRepository: MaterialRatesRepository = new MaterialRatesRepository()
  ) {}

  async run(count: number): Promise<number> {
    if (count <= 0) return 0;

    const existing = await this.repository.count();
    if (existing > 0) {
      console.log(`⏭️  material_sales: ${existing} row(s) already present, skipping`);
      return 0;
    }

    const rates = await this.ratesRepository.findAllActive();
    const today = todayInBusinessZone();
    let inserted = 0;
    let soldKg = 0;
    for (let i = 0; i < count; i++) {
      // Re-read lots each time: earlier sales lowered their stock.
      const lots = (await this.lotsRepository.findAllActive()).filter((lot) => lot.weightKg >= MIN_STOCK_KG);
      if (lots.length === 0) break;
      const lot = faker.helpers.arrayElement(lots);
      const quantityKg = roundTo2(lot.weightKg * faker.number.float({ min: 0.1, max: 0.4 }));
      const rate = rates.find((r) => r.materialId === lot.materialId)?.pricePerKg ?? DEFAULT_RATE;
      const unitPricePerKg = roundTo2(rate * faker.number.float({ min: 1.2, max: 1.5 }));
      const saleDate = daysBefore(today, faker.number.int({ min: 0, max: 30 }));

      await this.service.create({
        name: `Venta ${lot.material?.name ?? "material"} ${saleDate}`,
        buyerName: faker.helpers.arrayElement(BUYERS),
        materialLotId: lot.id,
        quantityKg,
        unitPricePerKg,
        saleDate,
        description: `Despacho desde el lote ${lot.name}`,
      });
      inserted++;
      soldKg += quantityKg;
    }

    console.log(`✅ material_sales: inserted ${inserted} row(s) (${soldKg.toFixed(2)} kg taken from lot stock)`);
    return inserted;
  }
}
