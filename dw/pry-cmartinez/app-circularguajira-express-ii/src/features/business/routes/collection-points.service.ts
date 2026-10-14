import { CollectionPointsRepository } from "./collection-points.repository";
import { RoutesService } from "./routes.service";
import { CollectionPoint } from "./collection-point.model";
import { ConflictError, NotFoundError } from "../../../shared/errors/httpError";
import { parseId } from "../../../shared/http/parseId";
import {
  parseCollectionPointCreate,
  parseCollectionPointPatch,
  parseCollectionPointUpdate,
} from "./dto/route.validation";

export class CollectionPointsService {
  constructor(
    private readonly collectionPointsRepository = new CollectionPointsRepository(),
    private readonly routesService = new RoutesService()
  ) {}

  // ================== READ ==================

  getAll(): Promise<CollectionPoint[]> {
    return this.collectionPointsRepository.findAllActive();
  }

  getOne(rawId: string): Promise<CollectionPoint> {
    return this.findActiveOrFail(rawId);
  }

  // Stops of an active route, in visit order.
  async getByRoute(rawRouteId: string): Promise<CollectionPoint[]> {
    const route = await this.routesService.findActiveOrFail(rawRouteId);
    return this.collectionPointsRepository.findActiveByRoute(route.id);
  }

  // ================== CREATE ==================

  async create(body: unknown): Promise<CollectionPoint> {
    const input = parseCollectionPointCreate(body);
    await this.routesService.assertActiveRoute(input.routeId);
    await this.ensureOrderIsFree(input.routeId, input.visitOrder);
    return this.collectionPointsRepository.create({
      routeId: input.routeId,
      name: input.name,
      address: input.address,
      visitOrder: input.visitOrder,
      status: input.status ?? "active",
    });
  }

  // ================== UPDATE ==================

  // PUT: full replacement; may move the point to another active route.
  async update(rawId: string, body: unknown): Promise<CollectionPoint> {
    const point = await this.findActiveOrFail(rawId);
    const input = parseCollectionPointUpdate(body);
    await this.routesService.assertActiveRoute(input.routeId);
    await this.ensureOrderIsFree(input.routeId, input.visitOrder, point.id);
    return this.collectionPointsRepository.update(point, input);
  }

  // PATCH: only the fields sent change; route and order are checked as a pair.
  async patch(rawId: string, body: unknown): Promise<CollectionPoint> {
    const point = await this.findActiveOrFail(rawId);
    const changes = parseCollectionPointPatch(body);
    if (changes.routeId !== undefined) {
      await this.routesService.assertActiveRoute(changes.routeId);
    }
    if (changes.routeId !== undefined || changes.visitOrder !== undefined) {
      await this.ensureOrderIsFree(
        changes.routeId ?? point.routeId,
        changes.visitOrder ?? point.visitOrder,
        point.id
      );
    }
    return this.collectionPointsRepository.update(point, changes);
  }

  // ================== DELETE ==================

  // Physical delete: also purges an inactive point.
  async delete(rawId: string): Promise<void> {
    const point = await this.collectionPointsRepository.findById(parseId(rawId));
    if (!point) {
      throw new NotFoundError("Punto de recolección no encontrado");
    }
    await this.collectionPointsRepository.delete(point);
  }

  // Logical delete: status = inactive; the stop leaves the route listing.
  async deactivate(rawId: string): Promise<CollectionPoint> {
    const point = await this.findActiveOrFail(rawId);
    return this.collectionPointsRepository.update(point, { status: "inactive" });
  }

  // ================== HELPERS ==================

  private async findActiveOrFail(rawId: string): Promise<CollectionPoint> {
    const point = await this.collectionPointsRepository.findById(parseId(rawId));
    if (!point || point.status !== "active") {
      throw new NotFoundError("Punto de recolección no encontrado o inactivo");
    }
    return point;
  }

  private async ensureOrderIsFree(routeId: number, visitOrder: number, ownId?: number): Promise<void> {
    const existing = await this.collectionPointsRepository.findByRouteAndOrder(routeId, visitOrder);
    if (existing && existing.id !== ownId) {
      throw new ConflictError(
        `La ruta ${routeId} ya tiene un punto en el orden de visita ${visitOrder} (${existing.name})`
      );
    }
  }
}
