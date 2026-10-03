import { Transaction } from "sequelize";
import { ConflictError, NotFoundError, ValidationError } from "../../../shared/errors/app-error";
import { withTransaction } from "../../../shared/database/with-transaction";
import { CreateRecyclerDto } from "./dto/create-recycler.dto";
import { PatchRecyclerDto } from "./dto/patch-recycler.dto";
import { RecyclerResponseDto, toRecyclerResponse } from "./dto/recycler-response.dto";
import { UpdateRecyclerDto } from "./dto/update-recycler.dto";
import { Recycler, RECYCLER_STATUSES, RecyclerStatus } from "./recycler.model";
import { RecyclerChanges, RecyclersRepository } from "./recyclers.repository";

const OPTIONAL_TEXT_FIELDS = ["description", "phone", "email", "documentNumber"] as const;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Business rules for recyclers: validation, uniqueness and logical deletion.
export class RecyclersService {
  constructor(private readonly repository: RecyclersRepository = new RecyclersRepository()) {}

  async findAll(): Promise<RecyclerResponseDto[]> {
    const recyclers = await this.repository.findAllActive();
    return recyclers.map(toRecyclerResponse);
  }

  async findOne(id: number): Promise<RecyclerResponseDto> {
    return toRecyclerResponse(await this.getOrFail(id));
  }

  async create(input: unknown): Promise<RecyclerResponseDto> {
    const dto = this.validate(input, { partial: false }) as CreateRecyclerDto;
    return withTransaction(async (transaction) => {
      await this.ensureUniqueDocument(dto.documentNumber, undefined, transaction);
      const recycler = await this.repository.create(
        {
          name: dto.name,
          description: dto.description ?? null,
          phone: dto.phone ?? null,
          email: dto.email ?? null,
          documentNumber: dto.documentNumber ?? null,
          status: dto.status ?? "active",
        },
        transaction
      );
      return toRecyclerResponse(recycler);
    });
  }

  async replace(id: number, input: unknown): Promise<RecyclerResponseDto> {
    const dto = this.validate(input, { partial: false }) as UpdateRecyclerDto;
    return withTransaction(async (transaction) => {
      const recycler = await this.getOrFail(id, transaction);
      await this.ensureUniqueDocument(dto.documentNumber, id, transaction);
      const updated = await this.repository.update(
        recycler,
        {
          name: dto.name,
          description: dto.description ?? null,
          phone: dto.phone ?? null,
          email: dto.email ?? null,
          documentNumber: dto.documentNumber ?? null,
          status: dto.status ?? recycler.status,
        },
        transaction
      );
      return toRecyclerResponse(updated);
    });
  }

  async patch(id: number, input: unknown): Promise<RecyclerResponseDto> {
    const dto = this.validate(input, { partial: true });
    if (Object.keys(dto).length === 0) {
      throw new ValidationError("Debe enviar al menos un campo para actualizar");
    }
    return withTransaction(async (transaction) => {
      const recycler = await this.getOrFail(id, transaction);
      await this.ensureUniqueDocument(dto.documentNumber, id, transaction);
      const updated = await this.repository.update(recycler, dto as RecyclerChanges, transaction);
      return toRecyclerResponse(updated);
    });
  }

  async deactivate(id: number): Promise<RecyclerResponseDto> {
    const recycler = await this.getOrFail(id);
    const updated = await this.repository.update(recycler, { status: "inactive" });
    return toRecyclerResponse(updated);
  }

  async remove(id: number): Promise<void> {
    const recycler = await this.getOrFail(id);
    await this.repository.delete(recycler);
  }

  private async getOrFail(id: number, transaction?: Transaction): Promise<Recycler> {
    const recycler = await this.repository.findById(id, transaction);
    if (!recycler) {
      throw new NotFoundError("Reciclador no encontrado");
    }
    return recycler;
  }

  private async ensureUniqueDocument(
    documentNumber: string | null | undefined,
    excludeId: number | undefined,
    transaction: Transaction
  ): Promise<void> {
    if (!documentNumber) return;
    const existing = await this.repository.findByDocumentNumber(documentNumber, excludeId, transaction);
    if (existing) {
      throw new ConflictError("Ya existe un reciclador con ese número de documento", { documentNumber });
    }
  }

  // Whitelists known fields and checks their types; unknown keys (id, timestamps...) are dropped.
  private validate(input: unknown, { partial }: { partial: boolean }): PatchRecyclerDto {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
      throw new ValidationError("El cuerpo de la petición debe ser un objeto JSON");
    }
    const body = input as Record<string, unknown>;
    const errors: string[] = [];
    const dto: PatchRecyclerDto = {};

    if (body.name !== undefined || !partial) {
      if (typeof body.name !== "string" || body.name.trim() === "") {
        errors.push("name es obligatorio y debe ser un texto no vacío");
      } else {
        dto.name = body.name.trim();
      }
    }

    for (const field of OPTIONAL_TEXT_FIELDS) {
      const value = body[field];
      if (value === undefined) continue;
      if (value !== null && typeof value !== "string") {
        errors.push(`${field} debe ser un texto o null`);
        continue;
      }
      dto[field] = value === null || value.trim() === "" ? null : value.trim();
    }

    if (dto.email && !EMAIL_PATTERN.test(dto.email)) {
      errors.push("email no tiene un formato válido");
    }

    if (body.status !== undefined) {
      if (!RECYCLER_STATUSES.includes(body.status as RecyclerStatus)) {
        errors.push(`status debe ser uno de: ${RECYCLER_STATUSES.join(", ")}`);
      } else {
        dto.status = body.status as RecyclerStatus;
      }
    }

    if (errors.length > 0) {
      throw new ValidationError("Datos de reciclador inválidos", errors);
    }
    return dto;
  }
}
