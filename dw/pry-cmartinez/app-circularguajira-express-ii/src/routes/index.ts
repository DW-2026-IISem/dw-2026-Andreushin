import { RecyclersRoutes } from "../features/business/collectors/recyclers.routes";
import { MaterialsRoutes } from "../features/business/materials/materials.routes";
import { RoutesRoutes } from "../features/business/routes/routes.routes";
import { WeighingRoutes } from "../features/business/weighing/weighing.routes";
import { SettlementsRoutes } from "../features/business/settlements/settlements.routes";
import { UsersRoutes } from "../features/auth/users/users.routes";
import { RolesRoutes } from "../features/auth/roles/roles.routes";
import { ResourcesRoutes } from "../features/auth/resources/resources.routes";
import { RoleUsersRoutes } from "../features/auth/role-users/role-users.routes";
import { ResourceRolesRoutes } from "../features/auth/resource-roles/resource-roles.routes";

export class Routes {
  public recyclersRoutes: RecyclersRoutes = new RecyclersRoutes();
  public materialsRoutes: MaterialsRoutes = new MaterialsRoutes();
  public routesRoutes: RoutesRoutes = new RoutesRoutes();
  public weighingRoutes: WeighingRoutes = new WeighingRoutes();
  public settlementsRoutes: SettlementsRoutes = new SettlementsRoutes();
  // Phase II: auth
  public usersRoutes: UsersRoutes = new UsersRoutes();
  public rolesRoutes: RolesRoutes = new RolesRoutes();
  public resourcesRoutes: ResourcesRoutes = new ResourcesRoutes();
  public roleUsersRoutes: RoleUsersRoutes = new RoleUsersRoutes();
  public resourceRolesRoutes: ResourceRolesRoutes = new ResourceRolesRoutes();
}
