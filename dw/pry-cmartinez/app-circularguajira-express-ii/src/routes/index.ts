import { RecyclersRoutes } from "../features/business/collectors/recyclers.routes";
import { MaterialsRoutes } from "../features/business/materials/materials.routes";
import { RoutesRoutes } from "../features/business/routes/routes.routes";

export class Routes {
  public recyclersRoutes: RecyclersRoutes = new RecyclersRoutes();
  public materialsRoutes: MaterialsRoutes = new MaterialsRoutes();
  public routesRoutes: RoutesRoutes = new RoutesRoutes();
}
