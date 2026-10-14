import { MaterialRatesRepository } from "./material-rates.repository";
import { MaterialsService } from "./materials.service";
import { MaterialRate } from "./material-rate.model";
import { ConflictError, NotFoundError } from "../../../shared/errors/httpError";
import { requiredDate } from "../../../shared/http/validation";
import { withTransaction } from "../../../shared/database/transaction";
import { parseMaterialRateCreate } from "./dto/material.validation";

const OPEN_END = "9999-12-31";
const TIME_ZONE = "America/Bogota";

// Today's calendar date in Colombia, as YYYY-MM-DD.
export const todayInColombia = (): string =>
  new Date().toLocaleDateString("en-CA", { timeZone: TIME_ZONE });

const dayBefore = (date: string): string => {
  const day = new Date(`${date}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() - 1);
  return day.toISOString().slice(0, 10);
};

/**
 * Rate history per material. The history is append-only (no PUT/DELETE) so that
 * settlements stay verifiable: a correction is a new rate from a new date.
 */
export class MaterialRatesService {
  constructor(
    private readonly materialRatesRepository = new MaterialRatesRepository(),
    private readonly materialsService = new MaterialsService()
  ) {}

  // ================== READ ==================

  async getHistory(rawMaterialId: string): Promise<MaterialRate[]> {
    const material = await this.materialsService.findActiveOrFail(rawMaterialId);
    return this.materialRatesRepository.findByMaterial(material.id);
  }

  // Applicable rate: the one whose period contains the date (today by default).
  async getApplicable(rawMaterialId: string, rawDate: unknown): Promise<MaterialRate> {
    const material = await this.materialsService.findActiveOrFail(rawMaterialId);
    const date = rawDate === undefined ? todayInColombia() : requiredDate(rawDate, "date");
    return this.findApplicableOrFail(material.id, date);
  }

  // Shared rule for later features (weighing/settlements): no rate outside its period.
  async findApplicableOrFail(materialId: number, date: string): Promise<MaterialRate> {
    const rate = await this.materialRatesRepository.findApplicable(materialId, date);
    if (!rate) {
      throw new NotFoundError(`No hay tarifa vigente para el material ${materialId} en ${date}`);
    }
    return rate;
  }

  // ================== CREATE ==================

  /**
   * Adds a rate period. An open-ended rate that started before it is closed the day
   * before; any other overlap is rejected. Both writes run in one transaction.
   */
  async create(rawMaterialId: string, body: unknown): Promise<MaterialRate> {
    const material = await this.materialsService.findActiveOrFail(rawMaterialId);
    const input = parseMaterialRateCreate(body);

    return withTransaction(async (transaction) => {
      const rates = await this.materialRatesRepository.findByMaterial(material.id, transaction);

      for (const rate of rates) {
        if (rate.validTo === null && rate.validFrom < input.validFrom) {
          await this.materialRatesRepository.close(rate, dayBefore(input.validFrom), transaction);
        }
      }

      const newEnd = input.validTo ?? OPEN_END;
      const overlapping = rates.find(
        (rate) => rate.validFrom <= newEnd && input.validFrom <= (rate.validTo ?? OPEN_END)
      );
      if (overlapping) {
        throw new ConflictError(
          `El periodo se cruza con la tarifa ${overlapping.id} ` +
            `(${overlapping.validFrom} a ${overlapping.validTo ?? "sin cierre"})`
        );
      }

      return this.materialRatesRepository.create(
        {
          materialId: material.id,
          pricePerKg: input.pricePerKg,
          validFrom: input.validFrom,
          validTo: input.validTo,
        },
        transaction
      );
    });
  }
}
