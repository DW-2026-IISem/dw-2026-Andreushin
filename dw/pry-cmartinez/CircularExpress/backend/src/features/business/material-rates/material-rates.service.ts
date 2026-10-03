import { Transaction } from "sequelize";
import { ConflictError, NotFoundError, ValidationError } from "../../../shared/errors/app-error";
import { withTransaction } from "../../../shared/database/with-transaction";
import { isValidDateOnly, todayInBusinessZone } from "../../../shared/utils/dates";
import { hasAtMostTwoDecimals } from "../../../shared/utils/numbers";
import { parseIdFilter } from "../../../shared/validation/query-filters";
import { MaterialsRepository } from "../materials/materials.repository";
import { CreateMaterialRateDto } from "./dto/create-material-rate.dto";
import { MaterialRateResponseDto, toMaterialRateResponse } from "./dto/material-rate-response.dto";
import { PatchMaterialRateDto } from "./dto/patch-material-rate.dto";
import { UpdateMaterialRateDto } from "./dto/update-material-rate.dto";
import { MATERIAL_RATE_STATUSES, MaterialRate, MaterialRateStatus } from "./material-rate.model";
import { MaterialRateChanges, MaterialRatesRepository } from "./material-rates.repository";

const NAME_MAX_LENGTH = 150;
const DESCRIPTION_MAX_LENGTH = 255;
const MAX_PRICE = 99_999_999.99; // DECIMAL(10, 2)

export interface MaterialRateWriteResult {
  materialRate: MaterialRateResponseDto;
  previousRatesClosed: number;
}

// Business rules for the rate history: active material, positive price, no future dates and
// a single current ("active") rate per material — activating one closes the previous one.
export class MaterialRatesService {
  constructor(
    private readonly repository: MaterialRatesRepository = new MaterialRatesRepository(),
    private readonly materialsRepository: MaterialsRepository = new MaterialsRepository()
  ) {}

  async findAll(materialIdFilter?: unknown): Promise<MaterialRateResponseDto[]> {
    const rates = await this.repository.findAllActive(parseIdFilter(materialIdFilter, "materialId"));
    return rates.map(toMaterialRateResponse);
  }

  async findOne(id: number): Promise<MaterialRateResponseDto> {
    return toMaterialRateResponse(await this.getOrFail(id));
  }

  async create(input: unknown): Promise<MaterialRateWriteResult> {
    const dto = this.validate(input, { partial: false }) as CreateMaterialRateDto;
    const validFrom = dto.validFrom ?? todayInBusinessZone();
    return withTransaction(async (transaction) => {
      await this.ensureActiveMaterial(dto.materialId, transaction);
      await this.ensureUniqueDate(dto.materialId, validFrom, undefined, transaction);
      const rate = await this.repository.create(
        {
          name: dto.name,
          description: dto.description ?? null,
          pricePerKg: dto.pricePerKg,
          validFrom,
          materialId: dto.materialId,
          status: dto.status ?? "active",
        },
        transaction
      );
      return this.closePreviousIfActive(rate, transaction);
    });
  }

  async replace(id: number, input: unknown): Promise<MaterialRateWriteResult> {
    const dto = this.validate(input, { partial: false }) as UpdateMaterialRateDto;
    const validFrom = dto.validFrom ?? todayInBusinessZone();
    return withTransaction(async (transaction) => {
      const rate = await this.getOrFail(id, transaction);
      if (dto.materialId !== rate.materialId) {
        await this.ensureActiveMaterial(dto.materialId, transaction);
      }
      await this.ensureUniqueDate(dto.materialId, validFrom, id, transaction);
      const updated = await this.repository.update(
        rate,
        {
          name: dto.name,
          description: dto.description ?? null,
          pricePerKg: dto.pricePerKg,
          validFrom,
          materialId: dto.materialId,
          status: dto.status ?? rate.status,
        },
        transaction
      );
      return this.closePreviousIfActive(updated, transaction);
    });
  }

  async patch(id: number, input: unknown): Promise<MaterialRateWriteResult> {
    const dto = this.validate(input, { partial: true });
    if (Object.keys(dto).length === 0) {
      throw new ValidationError("Debe enviar al menos un campo para actualizar");
    }
    return withTransaction(async (transaction) => {
      const rate = await this.getOrFail(id, transaction);
      if (dto.materialId !== undefined && dto.materialId !== rate.materialId) {
        await this.ensureActiveMaterial(dto.materialId, transaction);
      }
      // Uniqueness depends on both fields, so check the resulting pair.
      await this.ensureUniqueDate(dto.materialId ?? rate.materialId, dto.validFrom ?? rate.validFrom, id, transaction);
      const updated = await this.repository.update(rate, dto as MaterialRateChanges, transaction);
      return this.closePreviousIfActive(updated, transaction);
    });
  }

  async deactivate(id: number): Promise<MaterialRateResponseDto> {
    const rate = await this.getOrFail(id);
    const updated = await this.repository.update(rate, { status: "inactive" });
    return toMaterialRateResponse(updated);
  }

  async remove(id: number): Promise<void> {
    const rate = await this.getOrFail(id);
    await this.repository.delete(rate);
  }

  // Keeps a single current rate per material: an active rate closes the material's previous active one.
  private async closePreviousIfActive(rate: MaterialRate, transaction: Transaction): Promise<MaterialRateWriteResult> {
    const previousRatesClosed =
      rate.status === "active" ? await this.repository.deactivateOthers(rate.materialId, rate.id, transaction) : 0;
    return { materialRate: toMaterialRateResponse(rate), previousRatesClosed };
  }

  private async getOrFail(id: number, transaction?: Transaction): Promise<MaterialRate> {
    const rate = await this.repository.findById(id, transaction);
    if (!rate) {
      throw new NotFoundError("Tarifa no encontrada");
    }
    return rate;
  }

  private async ensureActiveMaterial(materialId: number, transaction: Transaction): Promise<void> {
    const material = await this.materialsRepository.findById(materialId, transaction);
    if (!material) {
      throw new ValidationError("El material indicado no existe", { materialId });
    }
    if (material.status !== "active") {
      throw new ValidationError("El material indicado está inactivo", { materialId });
    }
  }

  private async ensureUniqueDate(
    materialId: number,
    validFrom: string,
    excludeId: number | undefined,
    transaction: Transaction
  ): Promise<void> {
    const existing = await this.repository.findByMaterialAndDate(materialId, validFrom, excludeId, transaction);
    if (existing) {
      throw new ConflictError("El material ya tiene una tarifa que rige desde esa fecha", { materialId, validFrom });
    }
  }

  // Whitelists known fields and checks types, ranges and dates; unknown keys (id, timestamps...) are dropped.
  private validate(input: unknown, { partial }: { partial: boolean }): PatchMaterialRateDto {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
      throw new ValidationError("El cuerpo de la petición debe ser un objeto JSON");
    }
    const body = input as Record<string, unknown>;
    const errors: string[] = [];
    const dto: PatchMaterialRateDto = {};

    if (body.name !== undefined || !partial) {
      if (typeof body.name !== "string" || body.name.trim() === "") {
        errors.push("name es obligatorio y debe ser un texto no vacío");
      } else if (body.name.trim().length > NAME_MAX_LENGTH) {
        errors.push(`name admite máximo ${NAME_MAX_LENGTH} caracteres`);
      } else {
        dto.name = body.name.trim();
      }
    }

    if (body.materialId !== undefined || !partial) {
      const value = body.materialId;
      if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
        errors.push("materialId es obligatorio y debe ser un número entero positivo");
      } else {
        dto.materialId = value;
      }
    }

    if (body.pricePerKg !== undefined || !partial) {
      const value = body.pricePerKg;
      if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
        errors.push("pricePerKg es obligatorio y debe ser un número mayor que 0");
      } else if (value > MAX_PRICE || !hasAtMostTwoDecimals(value)) {
        errors.push(`pricePerKg admite máximo 2 decimales y hasta ${MAX_PRICE}`);
      } else {
        dto.pricePerKg = value;
      }
    }

    if (body.validFrom !== undefined) {
      const value = body.validFrom;
      if (!isValidDateOnly(value)) {
        errors.push("validFrom debe ser una fecha válida con formato YYYY-MM-DD");
      } else if (value > todayInBusinessZone()) {
        errors.push("validFrom no puede ser una fecha futura");
      } else {
        dto.validFrom = value;
      }
    }

    if (body.description !== undefined) {
      const value = body.description;
      if (value !== null && typeof value !== "string") {
        errors.push("description debe ser un texto o null");
      } else if (typeof value === "string" && value.trim().length > DESCRIPTION_MAX_LENGTH) {
        errors.push(`description admite máximo ${DESCRIPTION_MAX_LENGTH} caracteres`);
      } else {
        dto.description = value === null || value.trim() === "" ? null : value.trim();
      }
    }

    if (body.status !== undefined) {
      if (!MATERIAL_RATE_STATUSES.includes(body.status as MaterialRateStatus)) {
        errors.push(`status debe ser uno de: ${MATERIAL_RATE_STATUSES.join(", ")}`);
      } else {
        dto.status = body.status as MaterialRateStatus;
      }
    }

    if (errors.length > 0) {
      throw new ValidationError("Datos de tarifa inválidos", errors);
    }
    return dto;
  }
}
