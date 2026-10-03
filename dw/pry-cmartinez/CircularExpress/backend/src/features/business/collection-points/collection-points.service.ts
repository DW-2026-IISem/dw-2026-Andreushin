import { Transaction } from "sequelize";
import { ConflictError, NotFoundError, ValidationError } from "../../../shared/errors/app-error";
import { withTransaction } from "../../../shared/database/with-transaction";
import { RoutesRepository } from "../routes/routes.repository";
import {
  COLLECTION_POINT_STATUSES,
  CollectionPoint,
  CollectionPointStatus,
} from "./collection-point.model";
import { CollectionPointChanges, CollectionPointsRepository } from "./collection-points.repository";
import { CollectionPointResponseDto, toCollectionPointResponse } from "./dto/collection-point-response.dto";
import { CreateCollectionPointDto } from "./dto/create-collection-point.dto";
import { PatchCollectionPointDto } from "./dto/patch-collection-point.dto";
import { UpdateCollectionPointDto } from "./dto/update-collection-point.dto";

const NAME_MAX_LENGTH = 150;
const OPTIONAL_TEXT_FIELDS = { address: 255, description: 255 } as const;

// Business rules for collection points: the route must exist and be active, and names are unique per route.
export class CollectionPointsService {
  constructor(
    private readonly repository: CollectionPointsRepository = new CollectionPointsRepository(),
    private readonly routesRepository: RoutesRepository = new RoutesRepository()
  ) {}

  async findAll(routeIdFilter?: unknown): Promise<CollectionPointResponseDto[]> {
    const routeId = routeIdFilter === undefined ? undefined : this.parseRouteId(routeIdFilter);
    const points = await this.repository.findAllActive(routeId);
    return points.map(toCollectionPointResponse);
  }

  async findOne(id: number): Promise<CollectionPointResponseDto> {
    return toCollectionPointResponse(await this.getOrFail(id));
  }

  async create(input: unknown): Promise<CollectionPointResponseDto> {
    const dto = this.validate(input, { partial: false }) as CreateCollectionPointDto;
    return withTransaction(async (transaction) => {
      await this.ensureActiveRoute(dto.routeId, transaction);
      await this.ensureUniqueName(dto.name, dto.routeId, undefined, transaction);
      const point = await this.repository.create(
        {
          name: dto.name,
          routeId: dto.routeId,
          address: dto.address ?? null,
          description: dto.description ?? null,
          status: dto.status ?? "active",
        },
        transaction
      );
      return toCollectionPointResponse(point);
    });
  }

  async replace(id: number, input: unknown): Promise<CollectionPointResponseDto> {
    const dto = this.validate(input, { partial: false }) as UpdateCollectionPointDto;
    return withTransaction(async (transaction) => {
      const point = await this.getOrFail(id, transaction);
      if (dto.routeId !== point.routeId) {
        await this.ensureActiveRoute(dto.routeId, transaction);
      }
      await this.ensureUniqueName(dto.name, dto.routeId, id, transaction);
      const updated = await this.repository.update(
        point,
        {
          name: dto.name,
          routeId: dto.routeId,
          address: dto.address ?? null,
          description: dto.description ?? null,
          status: dto.status ?? point.status,
        },
        transaction
      );
      return toCollectionPointResponse(updated);
    });
  }

  async patch(id: number, input: unknown): Promise<CollectionPointResponseDto> {
    const dto = this.validate(input, { partial: true });
    if (Object.keys(dto).length === 0) {
      throw new ValidationError("Debe enviar al menos un campo para actualizar");
    }
    return withTransaction(async (transaction) => {
      const point = await this.getOrFail(id, transaction);
      if (dto.routeId !== undefined && dto.routeId !== point.routeId) {
        await this.ensureActiveRoute(dto.routeId, transaction);
      }
      // Uniqueness depends on both fields, so check the resulting pair.
      await this.ensureUniqueName(dto.name ?? point.name, dto.routeId ?? point.routeId, id, transaction);
      const updated = await this.repository.update(point, dto as CollectionPointChanges, transaction);
      return toCollectionPointResponse(updated);
    });
  }

  async deactivate(id: number): Promise<CollectionPointResponseDto> {
    const point = await this.getOrFail(id);
    const updated = await this.repository.update(point, { status: "inactive" });
    return toCollectionPointResponse(updated);
  }

  async remove(id: number): Promise<void> {
    const point = await this.getOrFail(id);
    await this.repository.delete(point);
  }

  private async getOrFail(id: number, transaction?: Transaction): Promise<CollectionPoint> {
    const point = await this.repository.findById(id, transaction);
    if (!point) {
      throw new NotFoundError("Punto de acopio no encontrado");
    }
    return point;
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

  private async ensureUniqueName(
    name: string,
    routeId: number,
    excludeId: number | undefined,
    transaction: Transaction
  ): Promise<void> {
    const existing = await this.repository.findByNameAndRoute(name, routeId, excludeId, transaction);
    if (existing) {
      throw new ConflictError("Ya existe un punto de acopio con ese nombre en la ruta", { name, routeId });
    }
  }

  private parseRouteId(value: unknown): number {
    const routeId = Number(value);
    if (!Number.isInteger(routeId) || routeId <= 0) {
      throw new ValidationError("routeId debe ser un número entero positivo");
    }
    return routeId;
  }

  // Whitelists known fields and checks types and lengths; unknown keys (id, timestamps...) are dropped.
  private validate(input: unknown, { partial }: { partial: boolean }): PatchCollectionPointDto {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
      throw new ValidationError("El cuerpo de la petición debe ser un objeto JSON");
    }
    const body = input as Record<string, unknown>;
    const errors: string[] = [];
    const dto: PatchCollectionPointDto = {};

    if (body.name !== undefined || !partial) {
      if (typeof body.name !== "string" || body.name.trim() === "") {
        errors.push("name es obligatorio y debe ser un texto no vacío");
      } else if (body.name.trim().length > NAME_MAX_LENGTH) {
        errors.push(`name admite máximo ${NAME_MAX_LENGTH} caracteres`);
      } else {
        dto.name = body.name.trim();
      }
    }

    if (body.routeId !== undefined || !partial) {
      if (typeof body.routeId !== "number" || !Number.isInteger(body.routeId) || body.routeId <= 0) {
        errors.push("routeId es obligatorio y debe ser un número entero positivo");
      } else {
        dto.routeId = body.routeId;
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
      if (!COLLECTION_POINT_STATUSES.includes(body.status as CollectionPointStatus)) {
        errors.push(`status debe ser uno de: ${COLLECTION_POINT_STATUSES.join(", ")}`);
      } else {
        dto.status = body.status as CollectionPointStatus;
      }
    }

    if (errors.length > 0) {
      throw new ValidationError("Datos de punto de acopio inválidos", errors);
    }
    return dto;
  }
}
