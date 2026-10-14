import { CollectionPoint, CollectionPointCreationAttributes } from "./collection-point.model";
import { CollectionPointPatchDto } from "./dto/route.dto";

export class CollectionPointsRepository {
  // ================== READ ==================

  findAllActive(): Promise<CollectionPoint[]> {
    return CollectionPoint.findAll({
      where: { status: "active" },
      order: [
        ["routeId", "ASC"],
        ["visitOrder", "ASC"],
      ],
    });
  }

  findById(id: number): Promise<CollectionPoint | null> {
    return CollectionPoint.findByPk(id);
  }

  // Active stops of a route in visit order.
  findActiveByRoute(routeId: number): Promise<CollectionPoint[]> {
    return CollectionPoint.findAll({
      where: { routeId, status: "active" },
      order: [["visitOrder", "ASC"]],
    });
  }

  // Any status: the (route, visitOrder) pair is unique in the table.
  findByRouteAndOrder(routeId: number, visitOrder: number): Promise<CollectionPoint | null> {
    return CollectionPoint.findOne({ where: { routeId, visitOrder } });
  }

  countByRoute(routeId: number): Promise<number> {
    return CollectionPoint.count({ where: { routeId } });
  }

  // ================== CREATE ==================

  create(data: CollectionPointCreationAttributes): Promise<CollectionPoint> {
    return CollectionPoint.create(data);
  }

  // ================== UPDATE ==================

  update(
    point: CollectionPoint,
    data: CollectionPointPatchDto | { status: "inactive" }
  ): Promise<CollectionPoint> {
    return point.update(data);
  }

  // ================== DELETE ==================

  delete(point: CollectionPoint): Promise<void> {
    return point.destroy();
  }
}
