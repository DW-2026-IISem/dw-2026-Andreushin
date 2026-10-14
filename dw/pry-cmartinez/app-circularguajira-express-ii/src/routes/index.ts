import { RecyclersRoutes } from "../features/business/collectors/recyclers.routes";
import { MaterialsRoutes } from "../features/business/materials/materials.routes";
import { RoutesRoutes } from "../features/business/routes/routes.routes";
import { WeighingRoutes } from "../features/business/weighing/weighing.routes";
import { SettlementsRoutes } from "../features/business/settlements/settlements.routes";
import { UsersRoutes } from "../features/auth/users/users.routes";

export class Routes {
  public recyclersRoutes: RecyclersRoutes = new RecyclersRoutes();
  public materialsRoutes: MaterialsRoutes = new MaterialsRoutes();
  public routesRoutes: RoutesRoutes = new RoutesRoutes();
  public weighingRoutes: WeighingRoutes = new WeighingRoutes();
  public settlementsRoutes: SettlementsRoutes = new SettlementsRoutes();
  // Phase II: auth
  public usersRoutes: UsersRoutes = new UsersRoutes();
}
