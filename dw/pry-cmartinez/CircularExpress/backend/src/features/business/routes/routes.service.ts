import { Transaction } from "sequelize";
import { ConflictError, NotFoundError, ValidationError } from "../../../shared/errors/app-error";
import { withTransaction } from "../../../shared/database/with-transaction";
import { CreateRouteDto } from "./dto/create-route.dto";
import { PatchRouteDto } from "./dto/patch-route.dto";
import { RouteResponseDto, toRouteResponse } from "./dto/route-response.dto";
import { UpdateRouteDto } from "./dto/update-route.dto";
import { Route, ROUTE_STATUSES, RouteStatus } from "./route.model";
import { RouteChanges, RoutesRepository } from "./routes.repository";

const REQUIRED_TEXT_FIELDS = { name: 150, municipality: 80 } as const;
const DESCRIPTION_MAX_LENGTH = 255;

// Business rules for collection routes: validation, unique name per municipality and logical deletion.
export class RoutesService {
  constructor(private readonly repository: RoutesRepository = new RoutesRepository()) {}

  async findAll(): Promise<RouteResponseDto[]> {
    const routes = await this.repository.findAllActive();
    return routes.map(toRouteResponse);
  }

  async findOne(id: number): Promise<RouteResponseDto> {
    return toRouteResponse(await this.getOrFail(id));
  }

  async create(input: unknown): Promise<RouteResponseDto> {
    const dto = this.validate(input, { partial: false }) as CreateRouteDto;
    return withTransaction(async (transaction) => {
      await this.ensureUniqueName(dto.name, dto.municipality, undefined, transaction);
      const route = await this.repository.create(
        {
          name: dto.name,
          municipality: dto.municipality,
          description: dto.description ?? null,
          status: dto.status ?? "active",
        },
        transaction
      );
      return toRouteResponse(route);
    });
  }

  async replace(id: number, input: unknown): Promise<RouteResponseDto> {
    const dto = this.validate(input, { partial: false }) as UpdateRouteDto;
    return withTransaction(async (transaction) => {
      const route = await this.getOrFail(id, transaction);
      await this.ensureUniqueName(dto.name, dto.municipality, id, transaction);
      const updated = await this.repository.update(
        route,
        {
          name: dto.name,
          municipality: dto.municipality,
          description: dto.description ?? null,
          status: dto.status ?? route.status,
        },
        transaction
      );
      return toRouteResponse(updated);
    });
  }

  async patch(id: number, input: unknown): Promise<RouteResponseDto> {
    const dto = this.validate(input, { partial: true });
    if (Object.keys(dto).length === 0) {
      throw new ValidationError("Debe enviar al menos un campo para actualizar");
    }
    return withTransaction(async (transaction) => {
      const route = await this.getOrFail(id, transaction);
      // Uniqueness depends on both fields, so check the resulting pair.
      await this.ensureUniqueName(dto.name ?? route.name, dto.municipality ?? route.municipality, id, transaction);
      const updated = await this.repository.update(route, dto as RouteChanges, transaction);
      return toRouteResponse(updated);
    });
  }

  async deactivate(id: number): Promise<RouteResponseDto> {
    const route = await this.getOrFail(id);
    const updated = await this.repository.update(route, { status: "inactive" });
    return toRouteResponse(updated);
  }

  async remove(id: number): Promise<void> {
    const route = await this.getOrFail(id);
    await this.repository.delete(route);
  }

  private async getOrFail(id: number, transaction?: Transaction): Promise<Route> {
    const route = await this.repository.findById(id, transaction);
    if (!route) {
      throw new NotFoundError("Ruta no encontrada");
    }
    return route;
  }

  private async ensureUniqueName(
    name: string,
    municipality: string,
    excludeId: number | undefined,
    transaction: Transaction
  ): Promise<void> {
    const existing = await this.repository.findByNameAndMunicipality(name, municipality, excludeId, transaction);
    if (existing) {
      throw new ConflictError("Ya existe una ruta con ese nombre en el municipio", { name, municipality });
    }
  }

  // Whitelists known fields and checks types and lengths; unknown keys (id, timestamps...) are dropped.
  private validate(input: unknown, { partial }: { partial: boolean }): PatchRouteDto {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
      throw new ValidationError("El cuerpo de la petición debe ser un objeto JSON");
    }
    const body = input as Record<string, unknown>;
    const errors: string[] = [];
    const dto: PatchRouteDto = {};

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
      if (!ROUTE_STATUSES.includes(body.status as RouteStatus)) {
        errors.push(`status debe ser uno de: ${ROUTE_STATUSES.join(", ")}`);
      } else {
        dto.status = body.status as RouteStatus;
      }
    }

    if (errors.length > 0) {
      throw new ValidationError("Datos de ruta inválidos", errors);
    }
    return dto;
  }
}
