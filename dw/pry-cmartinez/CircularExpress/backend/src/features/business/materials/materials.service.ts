import { Transaction } from "sequelize";
import { ConflictError, NotFoundError, ValidationError } from "../../../shared/errors/app-error";
import { withTransaction } from "../../../shared/database/with-transaction";
import { CreateMaterialDto } from "./dto/create-material.dto";
import { MaterialResponseDto, toMaterialResponse } from "./dto/material-response.dto";
import { PatchMaterialDto } from "./dto/patch-material.dto";
import { UpdateMaterialDto } from "./dto/update-material.dto";
import { Material, MATERIAL_STATUSES, MaterialStatus } from "./material.model";
import { MaterialChanges, MaterialsRepository } from "./materials.repository";

const NAME_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 255;

// Business rules for the recyclable materials catalog: validation, unique names and logical deletion.
export class MaterialsService {
  constructor(private readonly repository: MaterialsRepository = new MaterialsRepository()) {}

  async findAll(): Promise<MaterialResponseDto[]> {
    const materials = await this.repository.findAllActive();
    return materials.map(toMaterialResponse);
  }

  async findOne(id: number): Promise<MaterialResponseDto> {
    return toMaterialResponse(await this.getOrFail(id));
  }

  async create(input: unknown): Promise<MaterialResponseDto> {
    const dto = this.validate(input, { partial: false }) as CreateMaterialDto;
    return withTransaction(async (transaction) => {
      await this.ensureUniqueName(dto.name, undefined, transaction);
      const material = await this.repository.create(
        { name: dto.name, description: dto.description ?? null, status: dto.status ?? "active" },
        transaction
      );
      return toMaterialResponse(material);
    });
  }

  async replace(id: number, input: unknown): Promise<MaterialResponseDto> {
    const dto = this.validate(input, { partial: false }) as UpdateMaterialDto;
    return withTransaction(async (transaction) => {
      const material = await this.getOrFail(id, transaction);
      await this.ensureUniqueName(dto.name, id, transaction);
      const updated = await this.repository.update(
        material,
        { name: dto.name, description: dto.description ?? null, status: dto.status ?? material.status },
        transaction
      );
      return toMaterialResponse(updated);
    });
  }

  async patch(id: number, input: unknown): Promise<MaterialResponseDto> {
    const dto = this.validate(input, { partial: true });
    if (Object.keys(dto).length === 0) {
      throw new ValidationError("Debe enviar al menos un campo para actualizar");
    }
    return withTransaction(async (transaction) => {
      const material = await this.getOrFail(id, transaction);
      if (dto.name !== undefined) {
        await this.ensureUniqueName(dto.name, id, transaction);
      }
      const updated = await this.repository.update(material, dto as MaterialChanges, transaction);
      return toMaterialResponse(updated);
    });
  }

  async deactivate(id: number): Promise<MaterialResponseDto> {
    const material = await this.getOrFail(id);
    const updated = await this.repository.update(material, { status: "inactive" });
    return toMaterialResponse(updated);
  }

  async remove(id: number): Promise<void> {
    const material = await this.getOrFail(id);
    await this.repository.delete(material);
  }

  private async getOrFail(id: number, transaction?: Transaction): Promise<Material> {
    const material = await this.repository.findById(id, transaction);
    if (!material) {
      throw new NotFoundError("Material no encontrado");
    }
    return material;
  }

  private async ensureUniqueName(name: string, excludeId: number | undefined, transaction: Transaction): Promise<void> {
    const existing = await this.repository.findByName(name, excludeId, transaction);
    if (existing) {
      throw new ConflictError("Ya existe un material con ese nombre", { name });
    }
  }

  // Whitelists known fields and checks types and lengths; unknown keys (id, timestamps...) are dropped.
  private validate(input: unknown, { partial }: { partial: boolean }): PatchMaterialDto {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
      throw new ValidationError("El cuerpo de la petición debe ser un objeto JSON");
    }
    const body = input as Record<string, unknown>;
    const errors: string[] = [];
    const dto: PatchMaterialDto = {};

    if (body.name !== undefined || !partial) {
      if (typeof body.name !== "string" || body.name.trim() === "") {
        errors.push("name es obligatorio y debe ser un texto no vacío");
      } else if (body.name.trim().length > NAME_MAX_LENGTH) {
        errors.push(`name admite máximo ${NAME_MAX_LENGTH} caracteres`);
      } else {
        dto.name = body.name.trim();
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
      if (!MATERIAL_STATUSES.includes(body.status as MaterialStatus)) {
        errors.push(`status debe ser uno de: ${MATERIAL_STATUSES.join(", ")}`);
      } else {
        dto.status = body.status as MaterialStatus;
      }
    }

    if (errors.length > 0) {
      throw new ValidationError("Datos de material inválidos", errors);
    }
    return dto;
  }
}
