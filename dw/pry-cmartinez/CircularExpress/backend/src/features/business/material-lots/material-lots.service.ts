import { Transaction } from "sequelize";
import { ConflictError, NotFoundError, ValidationError } from "../../../shared/errors/app-error";
import { withTransaction } from "../../../shared/database/with-transaction";
import { parseIdFilter } from "../../../shared/validation/query-filters";
import { MaterialsRepository } from "../materials/materials.repository";
import { PlantsRepository } from "../plants/plants.repository";
import { CreateMaterialLotDto } from "./dto/create-material-lot.dto";
import { MaterialLotResponseDto, toMaterialLotResponse } from "./dto/material-lot-response.dto";
import { PatchMaterialLotDto } from "./dto/patch-material-lot.dto";
import { UpdateMaterialLotDto } from "./dto/update-material-lot.dto";
import { MATERIAL_LOT_STATUSES, MaterialLot, MaterialLotStatus } from "./material-lot.model";
import { MaterialLotChanges, MaterialLotsRepository } from "./material-lots.repository";

const NAME_MAX_LENGTH = 60;
const DESCRIPTION_MAX_LENGTH = 255;
const MAX_WEIGHT_KG = 9_999_999_999.99; // DECIMAL(12, 2)

type ValidationMode = "create" | "replace" | "patch";

const hasAtMostTwoDecimals = (value: number): boolean => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;

// Business rules for material lots (plant inventory): active plant and material, unique lot code,
// stock (weightKg) only set at creation, and no plant/material change while the lot holds stock.
export class MaterialLotsService {
  constructor(
    private readonly repository: MaterialLotsRepository = new MaterialLotsRepository(),
    private readonly plantsRepository: PlantsRepository = new PlantsRepository(),
    private readonly materialsRepository: MaterialsRepository = new MaterialsRepository()
  ) {}

  async findAll(query: { plantId?: unknown; materialId?: unknown } = {}): Promise<MaterialLotResponseDto[]> {
    const lots = await this.repository.findAllActive({
      plantId: parseIdFilter(query.plantId, "plantId"),
      materialId: parseIdFilter(query.materialId, "materialId"),
    });
    return lots.map(toMaterialLotResponse);
  }

  async findOne(id: number): Promise<MaterialLotResponseDto> {
    return toMaterialLotResponse(await this.getOrFail(id));
  }

  async create(input: unknown): Promise<MaterialLotResponseDto> {
    const dto = this.validate(input, "create") as CreateMaterialLotDto;
    return withTransaction(async (transaction) => {
      await this.ensureActivePlant(dto.plantId, transaction);
      await this.ensureActiveMaterial(dto.materialId, transaction);
      await this.ensureUniqueName(dto.name, undefined, transaction);
      const lot = await this.repository.create(
        {
          name: dto.name,
          description: dto.description ?? null,
          weightKg: dto.weightKg ?? 0,
          plantId: dto.plantId,
          materialId: dto.materialId,
          status: dto.status ?? "active",
        },
        transaction
      );
      return toMaterialLotResponse(lot);
    });
  }

  async replace(id: number, input: unknown): Promise<MaterialLotResponseDto> {
    const dto = this.validate(input, "replace") as UpdateMaterialLotDto;
    return withTransaction(async (transaction) => {
      const lot = await this.getOrFail(id, transaction);
      await this.ensureReferences(lot, dto, transaction);
      await this.ensureUniqueName(dto.name, id, transaction);
      const updated = await this.repository.update(
        lot,
        {
          name: dto.name,
          description: dto.description ?? null,
          plantId: dto.plantId,
          materialId: dto.materialId,
          status: dto.status ?? lot.status,
        },
        transaction
      );
      return toMaterialLotResponse(updated);
    });
  }

  async patch(id: number, input: unknown): Promise<MaterialLotResponseDto> {
    const dto = this.validate(input, "patch");
    if (Object.keys(dto).length === 0) {
      throw new ValidationError("Debe enviar al menos un campo para actualizar");
    }
    return withTransaction(async (transaction) => {
      const lot = await this.getOrFail(id, transaction);
      await this.ensureReferences(lot, dto, transaction);
      if (dto.name !== undefined) {
        await this.ensureUniqueName(dto.name, id, transaction);
      }
      const updated = await this.repository.update(lot, dto as MaterialLotChanges, transaction);
      return toMaterialLotResponse(updated);
    });
  }

  async deactivate(id: number): Promise<MaterialLotResponseDto> {
    const lot = await this.getOrFail(id);
    const updated = await this.repository.update(lot, { status: "inactive" });
    return toMaterialLotResponse(updated);
  }

  async remove(id: number): Promise<void> {
    const lot = await this.getOrFail(id);
    await this.repository.delete(lot);
  }

  private async getOrFail(id: number, transaction?: Transaction): Promise<MaterialLot> {
    const lot = await this.repository.findById(id, transaction);
    if (!lot) {
      throw new NotFoundError("Lote no encontrado");
    }
    return lot;
  }

  // A lot holding stock keeps its plant and material; changed references must be active.
  private async ensureReferences(lot: MaterialLot, dto: PatchMaterialLotDto, transaction: Transaction): Promise<void> {
    const plantChanges = dto.plantId !== undefined && dto.plantId !== lot.plantId;
    const materialChanges = dto.materialId !== undefined && dto.materialId !== lot.materialId;
    if ((plantChanges || materialChanges) && lot.weightKg > 0) {
      throw new ConflictError("Un lote con existencias no puede cambiar de planta ni de material", {
        weightKg: lot.weightKg,
      });
    }
    if (plantChanges) await this.ensureActivePlant(dto.plantId!, transaction);
    if (materialChanges) await this.ensureActiveMaterial(dto.materialId!, transaction);
  }

  private async ensureActivePlant(plantId: number, transaction: Transaction): Promise<void> {
    const plant = await this.plantsRepository.findById(plantId, transaction);
    if (!plant) {
      throw new ValidationError("La planta indicada no existe", { plantId });
    }
    if (plant.status !== "active") {
      throw new ValidationError("La planta indicada está inactiva", { plantId });
    }
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

  private async ensureUniqueName(name: string, excludeId: number | undefined, transaction: Transaction): Promise<void> {
    const existing = await this.repository.findByName(name, excludeId, transaction);
    if (existing) {
      throw new ConflictError("Ya existe un lote con ese código", { name });
    }
  }

  // Whitelists known fields and checks types, lengths and ranges; unknown keys (id, timestamps...) are dropped.
  private validate(input: unknown, mode: ValidationMode): CreateMaterialLotDto | PatchMaterialLotDto {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
      throw new ValidationError("El cuerpo de la petición debe ser un objeto JSON");
    }
    const partial = mode === "patch";
    const body = input as Record<string, unknown>;
    const errors: string[] = [];
    const dto: Partial<CreateMaterialLotDto> = {};

    if (body.name !== undefined || !partial) {
      if (typeof body.name !== "string" || body.name.trim() === "") {
        errors.push("name (código del lote) es obligatorio y debe ser un texto no vacío");
      } else if (body.name.trim().length > NAME_MAX_LENGTH) {
        errors.push(`name admite máximo ${NAME_MAX_LENGTH} caracteres`);
      } else {
        dto.name = body.name.trim();
      }
    }

    for (const field of ["plantId", "materialId"] as const) {
      const value = body[field];
      if (value === undefined && partial) continue;
      if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
        errors.push(`${field} es obligatorio y debe ser un número entero positivo`);
      } else {
        dto[field] = value;
      }
    }

    if (body.weightKg !== undefined) {
      const value = body.weightKg;
      if (mode !== "create") {
        errors.push("weightKg solo se fija al crear el lote; después cambia con pesajes y ventas");
      } else if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
        errors.push("weightKg debe ser un número mayor o igual a 0");
      } else if (value > MAX_WEIGHT_KG || !hasAtMostTwoDecimals(value)) {
        errors.push(`weightKg admite máximo 2 decimales y hasta ${MAX_WEIGHT_KG}`);
      } else {
        dto.weightKg = value;
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
      if (!MATERIAL_LOT_STATUSES.includes(body.status as MaterialLotStatus)) {
        errors.push(`status debe ser uno de: ${MATERIAL_LOT_STATUSES.join(", ")}`);
      } else {
        dto.status = body.status as MaterialLotStatus;
      }
    }

    if (errors.length > 0) {
      throw new ValidationError("Datos de lote inválidos", errors);
    }
    return dto;
  }
}
