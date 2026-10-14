import { RoutesRepository } from "./routes.repository";
import { CollectionPointsRepository } from "./collection-points.repository";
import { Route } from "./route.model";
import { BadRequestError, ConflictError, NotFoundError } from "../../../shared/errors/httpError";
import { parseId } from "../../../shared/http/parseId";
import { parseRouteCreate, parseRoutePatch, parseRouteUpdate } from "./dto/route.validation";

export class RoutesService {
  constructor(
    private readonly routesRepository = new RoutesRepository(),
    private readonly collectionPointsRepository = new CollectionPointsRepository()
  ) {}

  // ================== READ ==================

  getAll(): Promise<Route[]> {
    return this.routesRepository.findAllActive();
  }

  getOne(rawId: string): Promise<Route> {
    return this.findActiveOrFail(rawId);
  }

  // ================== CREATE ==================

  async create(body: unknown): Promise<Route> {
    const input = parseRouteCreate(body);
    await this.ensureNameIsFree(input.name);
    // Field by field on purpose (no mass assignment).
    return this.routesRepository.create({
      name: input.name,
      municipality: input.municipality,
      description: input.description,
      status: input.status ?? "active",
    });
  }

  // ================== UPDATE ==================

  // PUT: full replacement; an omitted description is cleared.
  async update(rawId: string, body: unknown): Promise<Route> {
    const route = await this.findActiveOrFail(rawId);
    const input = parseRouteUpdate(body);
    await this.ensureNameIsFree(input.name, route.id);
    return this.routesRepository.update(route, input);
  }

  // PATCH: only the fields sent change.
  async patch(rawId: string, body: unknown): Promise<Route> {
    const route = await this.findActiveOrFail(rawId);
    const changes = parseRoutePatch(body);
    if (changes.name !== undefined) {
      await this.ensureNameIsFree(changes.name, route.id);
    }
    return this.routesRepository.update(route, changes);
  }

  // ================== DELETE ==================

  // Physical delete: also purges an inactive route, but never one that still has points.
  async delete(rawId: string): Promise<void> {
    const route = await this.routesRepository.findById(parseId(rawId));
    if (!route) {
      throw new NotFoundError("Ruta no encontrada");
    }
    const points = await this.collectionPointsRepository.countByRoute(route.id);
    if (points > 0) {
      throw new ConflictError(
        `La ruta tiene ${points} punto(s) de recolección; elimínalos o desactiva la ruta`
      );
    }
    await this.routesRepository.delete(route);
  }

  // Logical delete: status = inactive; the route leaves listings and new assignments.
  async deactivate(rawId: string): Promise<Route> {
    const route = await this.findActiveOrFail(rawId);
    return this.routesRepository.update(route, { status: "inactive" });
  }

  // ================== HELPERS ==================

  // Logical-delete policy: an inactive route is invisible to the API.
  async findActiveOrFail(rawId: string): Promise<Route> {
    const route = await this.routesRepository.findById(parseId(rawId));
    if (!route || route.status !== "active") {
      throw new NotFoundError("Ruta no encontrada o inactiva");
    }
    return route;
  }

  /**
   * Membership rule for anything assigned to a route (points now, collections in ISS-08):
   * 404 if the referenced route does not exist, 400 if it is inactive. 400 and not 404
   * because the resource in the URL exists; what fails is the reference being assigned.
   */
  async assertActiveRoute(routeId: number): Promise<Route> {
    const route = await this.routesRepository.findById(routeId);
    if (!route) {
      throw new NotFoundError(`Ruta no encontrada: ${routeId}`);
    }
    if (route.status !== "active") {
      throw new BadRequestError(`La ruta ${routeId} debe estar activa`);
    }
    return route;
  }

  private async ensureNameIsFree(name: string, ownId?: number): Promise<void> {
    const existing = await this.routesRepository.findByName(name);
    if (existing && existing.id !== ownId) {
      throw new ConflictError(`Ya existe una ruta llamada ${name}`);
    }
  }
}
