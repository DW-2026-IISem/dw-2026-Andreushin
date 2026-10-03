import { Transaction } from "sequelize";
import { ConflictError, NotFoundError, ValidationError } from "../../../shared/errors/app-error";
import { withTransaction } from "../../../shared/database/with-transaction";
import { isValidDateOnly, todayInBusinessZone } from "../../../shared/utils/dates";
import { parseIdFilter } from "../../../shared/validation/query-filters";
import { RecyclersRepository } from "../recyclers/recyclers.repository";
import { RoutesRepository } from "../routes/routes.repository";
import { Collection, COLLECTION_STATUSES, CollectionStatus } from "./collection.model";
import { CollectionChanges, CollectionsRepository } from "./collections.repository";
import { CollectionResponseDto, toCollectionResponse } from "./dto/collection-response.dto";
import { CreateCollectionDto } from "./dto/create-collection.dto";
import { PatchCollectionDto } from "./dto/patch-collection.dto";
import { UpdateCollectionDto } from "./dto/update-collection.dto";

const NAME_MAX_LENGTH = 150;
const DESCRIPTION_MAX_LENGTH = 255;

// Business rules for collection workdays: active recycler and route, no future dates, one per recycler/route/day.
export class CollectionsService {
  constructor(
    private readonly repository: CollectionsRepository = new CollectionsRepository(),
    private readonly recyclersRepository: RecyclersRepository = new RecyclersRepository(),
    private readonly routesRepository: RoutesRepository = new RoutesRepository()
  ) {}

  async findAll(query: { recyclerId?: unknown; routeId?: unknown } = {}): Promise<CollectionResponseDto[]> {
    const collections = await this.repository.findAllActive({
      recyclerId: parseIdFilter(query.recyclerId, "recyclerId"),
      routeId: parseIdFilter(query.routeId, "routeId"),
    });
    return collections.map(toCollectionResponse);
  }

  async findOne(id: number): Promise<CollectionResponseDto> {
    return toCollectionResponse(await this.getOrFail(id));
  }

  async create(input: unknown): Promise<CollectionResponseDto> {
    const dto = this.validate(input, { partial: false }) as CreateCollectionDto;
    const collectionDate = dto.collectionDate ?? todayInBusinessZone();
    return withTransaction(async (transaction) => {
      await this.ensureActiveRecycler(dto.recyclerId, transaction);
      await this.ensureActiveRoute(dto.routeId, transaction);
      await this.ensureNoDuplicate(dto.recyclerId, dto.routeId, collectionDate, undefined, transaction);
      const collection = await this.repository.create(
        {
          name: dto.name,
          description: dto.description ?? null,
          collectionDate,
          recyclerId: dto.recyclerId,
          routeId: dto.routeId,
          status: dto.status ?? "active",
        },
        transaction
      );
      return toCollectionResponse(collection);
    });
  }

  async replace(id: number, input: unknown): Promise<CollectionResponseDto> {
    const dto = this.validate(input, { partial: false }) as UpdateCollectionDto;
    const collectionDate = dto.collectionDate ?? todayInBusinessZone();
    return withTransaction(async (transaction) => {
      const collection = await this.getOrFail(id, transaction);
      await this.ensureReferences(collection, dto, transaction);
      await this.ensureNoDuplicate(dto.recyclerId, dto.routeId, collectionDate, id, transaction);
      const updated = await this.repository.update(
        collection,
        {
          name: dto.name,
          description: dto.description ?? null,
          collectionDate,
          recyclerId: dto.recyclerId,
          routeId: dto.routeId,
          status: dto.status ?? collection.status,
        },
        transaction
      );
      return toCollectionResponse(updated);
    });
  }

  async patch(id: number, input: unknown): Promise<CollectionResponseDto> {
    const dto = this.validate(input, { partial: true });
    if (Object.keys(dto).length === 0) {
      throw new ValidationError("Debe enviar al menos un campo para actualizar");
    }
    return withTransaction(async (transaction) => {
      const collection = await this.getOrFail(id, transaction);
      await this.ensureReferences(collection, dto, transaction);
      // Uniqueness depends on three fields, so check the resulting combination.
      await this.ensureNoDuplicate(
        dto.recyclerId ?? collection.recyclerId,
        dto.routeId ?? collection.routeId,
        dto.collectionDate ?? collection.collectionDate,
        id,
        transaction
      );
      const updated = await this.repository.update(collection, dto as CollectionChanges, transaction);
      return toCollectionResponse(updated);
    });
  }

  async deactivate(id: number): Promise<CollectionResponseDto> {
    const collection = await this.getOrFail(id);
    const updated = await this.repository.update(collection, { status: "inactive" });
    return toCollectionResponse(updated);
  }

  async remove(id: number): Promise<void> {
    const collection = await this.getOrFail(id);
    await this.repository.delete(collection);
  }

  private async getOrFail(id: number, transaction?: Transaction): Promise<Collection> {
    const collection = await this.repository.findById(id, transaction);
    if (!collection) {
      throw new NotFoundError("Jornada de recolección no encontrada");
    }
    return collection;
  }

  // Only re-check a reference when it changes, so existing workdays stay editable if a recycler/route is later deactivated.
  private async ensureReferences(collection: Collection, dto: PatchCollectionDto, transaction: Transaction): Promise<void> {
    if (dto.recyclerId !== undefined && dto.recyclerId !== collection.recyclerId) {
      await this.ensureActiveRecycler(dto.recyclerId, transaction);
    }
    if (dto.routeId !== undefined && dto.routeId !== collection.routeId) {
      await this.ensureActiveRoute(dto.routeId, transaction);
    }
  }

  private async ensureActiveRecycler(recyclerId: number, transaction: Transaction): Promise<void> {
    const recycler = await this.recyclersRepository.findById(recyclerId, transaction);
    if (!recycler) {
      throw new ValidationError("El reciclador indicado no existe", { recyclerId });
    }
    if (recycler.status !== "active") {
      throw new ValidationError("El reciclador indicado está inactivo", { recyclerId });
    }
  }

  private async ensureActiveRoute(routeId: number, transaction: Transaction): Promise<void> {
    const route = await this.routesRepository.findById(routeId, transaction);
    if (!route) {
      throw new ValidationError("La ruta indicada no existe", { routeId });
    }
    if (route.status !== "active") {
      throw new ValidationError("La ruta indicada está inactiva", { routeId });
    }
  }

  private async ensureNoDuplicate(
    recyclerId: number,
    routeId: number,
    collectionDate: string,
    excludeId: number | undefined,
    transaction: Transaction
  ): Promise<void> {
    const existing = await this.repository.findDuplicate(recyclerId, routeId, collectionDate, excludeId, transaction);
    if (existing) {
      throw new ConflictError("El reciclador ya tiene una jornada en esa ruta y fecha", {
        recyclerId,
        routeId,
        collectionDate,
      });
    }
  }

  // Whitelists known fields and checks types, lengths and dates; unknown keys (id, timestamps...) are dropped.
  private validate(input: unknown, { partial }: { partial: boolean }): PatchCollectionDto {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
      throw new ValidationError("El cuerpo de la petición debe ser un objeto JSON");
    }
    const body = input as Record<string, unknown>;
    const errors: string[] = [];
    const dto: PatchCollectionDto = {};

    if (body.name !== undefined || !partial) {
      if (typeof body.name !== "string" || body.name.trim() === "") {
        errors.push("name es obligatorio y debe ser un texto no vacío");
      } else if (body.name.trim().length > NAME_MAX_LENGTH) {
        errors.push(`name admite máximo ${NAME_MAX_LENGTH} caracteres`);
      } else {
        dto.name = body.name.trim();
      }
    }

    for (const field of ["recyclerId", "routeId"] as const) {
      const value = body[field];
      if (value === undefined && partial) continue;
      if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
        errors.push(`${field} es obligatorio y debe ser un número entero positivo`);
      } else {
        dto[field] = value;
      }
    }

    if (body.collectionDate !== undefined) {
      const value = body.collectionDate;
      if (!isValidDateOnly(value)) {
        errors.push("collectionDate debe ser una fecha válida con formato YYYY-MM-DD");
      } else if (value > todayInBusinessZone()) {
        errors.push("collectionDate no puede ser una fecha futura");
      } else {
        dto.collectionDate = value;
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
      if (!COLLECTION_STATUSES.includes(body.status as CollectionStatus)) {
        errors.push(`status debe ser uno de: ${COLLECTION_STATUSES.join(", ")}`);
      } else {
        dto.status = body.status as CollectionStatus;
      }
    }

    if (errors.length > 0) {
      throw new ValidationError("Datos de jornada inválidos", errors);
    }
    return dto;
  }
}
