import { Transaction } from "sequelize";
import { ConflictError, NotFoundError, ValidationError } from "../../../shared/errors/app-error";
import { withTransaction } from "../../../shared/database/with-transaction";
import { parseTextFilter } from "../../../shared/validation/query-filters";
import { CreatePlantDto } from "./dto/create-plant.dto";
import { PatchPlantDto } from "./dto/patch-plant.dto";
import { PlantResponseDto, toPlantResponse } from "./dto/plant-response.dto";
import { UpdatePlantDto } from "./dto/update-plant.dto";
import { Plant, PLANT_STATUSES, PlantStatus } from "./plant.model";
import { PlantChanges, PlantsRepository } from "./plants.repository";

const REQUIRED_TEXT_FIELDS = { name: 150, municipality: 80 } as const;
const OPTIONAL_TEXT_FIELDS = { address: 255, description: 255 } as const;

// Business rules for plants: validation, unique names and logical deletion.
export class PlantsService {
  constructor(private readonly repository: PlantsRepository = new PlantsRepository()) {}

  async findAll(municipalityFilter?: unknown): Promise<PlantResponseDto[]> {
    const plants = await this.repository.findAllActive(parseTextFilter(municipalityFilter, "municipality", 80));
    return plants.map(toPlantResponse);
  }

  async findOne(id: number): Promise<PlantResponseDto> {
    return toPlantResponse(await this.getOrFail(id));
  }

  async create(input: unknown): Promise<PlantResponseDto> {
    const dto = this.validate(input, { partial: false }) as CreatePlantDto;
    return withTransaction(async (transaction) => {
      await this.ensureUniqueName(dto.name, undefined, transaction);
      const plant = await this.repository.create(
        {
          name: dto.name,
          municipality: dto.municipality,
          address: dto.address ?? null,
          description: dto.description ?? null,
          status: dto.status ?? "active",
        },
        transaction
      );
      return toPlantResponse(plant);
    });
  }

  async replace(id: number, input: unknown): Promise<PlantResponseDto> {
    const dto = this.validate(input, { partial: false }) as UpdatePlantDto;
    return withTransaction(async (transaction) => {
      const plant = await this.getOrFail(id, transaction);
      await this.ensureUniqueName(dto.name, id, transaction);
      const updated = await this.repository.update(
        plant,
        {
          name: dto.name,
          municipality: dto.municipality,
          address: dto.address ?? null,
          description: dto.description ?? null,
          status: dto.status ?? plant.status,
        },
        transaction
      );
      return toPlantResponse(updated);
    });
  }

  async patch(id: number, input: unknown): Promise<PlantResponseDto> {
    const dto = this.validate(input, { partial: true });
    if (Object.keys(dto).length === 0) {
      throw new ValidationError("Debe enviar al menos un campo para actualizar");
    }
    return withTransaction(async (transaction) => {
      const plant = await this.getOrFail(id, transaction);
      if (dto.name !== undefined) {
        await this.ensureUniqueName(dto.name, id, transaction);
      }
      const updated = await this.repository.update(plant, dto as PlantChanges, transaction);
      return toPlantResponse(updated);
    });
  }

  async deactivate(id: number): Promise<PlantResponseDto> {
    const plant = await this.getOrFail(id);
    const updated = await this.repository.update(plant, { status: "inactive" });
    return toPlantResponse(updated);
  }

  async remove(id: number): Promise<void> {
    const plant = await this.getOrFail(id);
    await this.repository.delete(plant);
  }

  private async getOrFail(id: number, transaction?: Transaction): Promise<Plant> {
    const plant = await this.repository.findById(id, transaction);
    if (!plant) {
      throw new NotFoundError("Planta no encontrada");
    }
    return plant;
  }

  private async ensureUniqueName(name: string, excludeId: number | undefined, transaction: Transaction): Promise<void> {
    const existing = await this.repository.findByName(name, excludeId, transaction);
    if (existing) {
      throw new ConflictError("Ya existe una planta con ese nombre", { name });
    }
  }

  // Whitelists known fields and checks types and lengths; unknown keys (id, timestamps...) are dropped.
  private validate(input: unknown, { partial }: { partial: boolean }): PatchPlantDto {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
      throw new ValidationError("El cuerpo de la petición debe ser un objeto JSON");
    }
    const body = input as Record<string, unknown>;
    const errors: string[] = [];
    const dto: PatchPlantDto = {};

    for (const [field, maxLength] of Object.entries(REQUIRED_TEXT_FIELDS) as [keyof typeof REQUIRED_TEXT_FIELDS, number][]) {
      const value = body[field];
      if (value === undefined && partial) continue;
      if (typeof value !== "string" || value.trim() === "") {
        errors.push(`${field} es obligatorio y debe ser un texto no vacío`);
      } else if (value.trim().length > maxLength) {
        errors.push(`${field} admite máximo ${maxLength} caracteres`);
      } else {
        dto[field] = value.trim();
      }
    }

    for (const [field, maxLength] of Object.entries(OPTIONAL_TEXT_FIELDS) as [keyof typeof OPTIONAL_TEXT_FIELDS, number][]) {
      const value = body[field];
      if (value === undefined) continue;
      if (value !== null && typeof value !== "string") {
        errors.push(`${field} debe ser un texto o null`);
      } else if (typeof value === "string" && value.trim().length > maxLength) {
        errors.push(`${field} admite máximo ${maxLength} caracteres`);
      } else {
        dto[field] = value === null || value.trim() === "" ? null : value.trim();
      }
    }

    if (body.status !== undefined) {
      if (!PLANT_STATUSES.includes(body.status as PlantStatus)) {
        errors.push(`status debe ser uno de: ${PLANT_STATUSES.join(", ")}`);
      } else {
        dto.status = body.status as PlantStatus;
      }
    }

    if (errors.length > 0) {
      throw new ValidationError("Datos de planta inválidos", errors);
    }
    return dto;
  }
}
