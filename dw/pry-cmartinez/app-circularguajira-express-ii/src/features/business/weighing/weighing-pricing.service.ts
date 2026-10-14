import { MaterialsRepository } from "../materials/materials.repository";
import { MaterialRatesService } from "../materials/material-rates.service";
import { BadRequestError, NotFoundError } from "../../../shared/errors/httpError";
import { calculateLine } from "./weighing.calculator";
import { WeighingLineDto } from "./dto/weighing.dto";

export interface PricedLine {
  materialId: number;
  rateId: number;
  pricePerKg: number;
  grossKg: number;
  tareKg: number;
  netKg: number;
  amount: number;
}

/**
 * Prices a weighing: the material must exist (404) and be active (400) for new lines,
 * and the rate is the one whose period contains the collection date (404 otherwise:
 * a rate is never applied outside its period).
 */
export class WeighingPricingService {
  constructor(
    private readonly materialsRepository = new MaterialsRepository(),
    private readonly materialRatesService = new MaterialRatesService()
  ) {}

  async priceLine(line: WeighingLineDto, collectedOn: string, isNewLine = true): Promise<PricedLine> {
    if (isNewLine) {
      await this.assertActiveMaterial(line.materialId);
    }
    const rate = await this.materialRatesService.findApplicableOrFail(line.materialId, collectedOn);
    return {
      materialId: line.materialId,
      rateId: rate.id,
      pricePerKg: rate.pricePerKg,
      grossKg: line.grossKg,
      tareKg: line.tareKg,
      ...calculateLine(line.grossKg, line.tareKg, rate.pricePerKg),
    };
  }

  private async assertActiveMaterial(materialId: number): Promise<void> {
    const material = await this.materialsRepository.findById(materialId);
    if (!material) {
      throw new NotFoundError(`Material no encontrado: ${materialId}`);
    }
    if (material.status !== "active") {
      throw new BadRequestError(`El material ${material.name} debe estar activo`);
    }
  }
}
