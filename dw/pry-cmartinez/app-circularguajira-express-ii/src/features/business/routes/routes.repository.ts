import { Route, RouteCreationAttributes } from "./route.model";
import { RoutePatchDto } from "./dto/route.dto";

export class RoutesRepository {
  // ================== READ ==================

  findAllActive(): Promise<Route[]> {
    return Route.findAll({ where: { status: "active" }, order: [["name", "ASC"]] });
  }

  findById(id: number): Promise<Route | null> {
    return Route.findByPk(id);
  }

  // Any status: names stay unique even for inactive routes.
  findByName(name: string): Promise<Route | null> {
    return Route.findOne({ where: { name } });
  }

  // ================== CREATE ==================

  create(data: RouteCreationAttributes): Promise<Route> {
    return Route.create(data);
  }

  // ================== UPDATE ==================

  update(route: Route, data: RoutePatchDto | { status: "inactive" }): Promise<Route> {
    return route.update(data);
  }

  // ================== DELETE ==================

  delete(route: Route): Promise<void> {
    return route.destroy();
  }
}
