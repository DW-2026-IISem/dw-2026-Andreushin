import { RecyclersRoutes } from "../features/business/collectors/crud/recyclers/recyclers.routes";
import { MaterialsRoutes } from "../features/business/materials/crud/materials/materials.routes";
import { MaterialRatesRoutes } from "../features/business/materials/crud/material-rates/material-rates.routes";
import { RoutesRoutes } from "../features/business/routes/crud/routes/routes.routes";
import { CollectionPointsRoutes } from "../features/business/routes/crud/collection-points/collection-points.routes";
import { CollectionsRoutes } from "../features/business/weighing/crud/collections/collections.routes";
import { WeighingsRoutes } from "../features/business/weighing/crud/weighings/weighings.routes";
import { SettlementsRoutes } from "../features/business/settlements/crud/settlements/settlements.routes";
import { UsersRoutes } from "../features/auth/users/crud/users.routes";
import { RolesRoutes } from "../features/auth/roles/crud/roles.routes";
import { ResourcesRoutes } from "../features/auth/resources/crud/resources.routes";
import { RoleUsersRoutes } from "../features/auth/role-users/crud/role-users.routes";
import { ResourceRolesRoutes } from "../features/auth/resource-roles/crud/resource-roles.routes";
import { RefreshTokensRoutes } from "../features/auth/refresh-tokens/crud/refresh-tokens.routes";
import { SessionRoutes } from "../features/auth/session/session.routes";
import { ArchiveRoutes } from "../features/auth/archive/archive.routes";

export class Routes {
  public recyclersRoutes: RecyclersRoutes = new RecyclersRoutes();
  public materialsRoutes: MaterialsRoutes = new MaterialsRoutes();
  public materialRatesRoutes: MaterialRatesRoutes = new MaterialRatesRoutes();
  public routesRoutes: RoutesRoutes = new RoutesRoutes();
  public collectionPointsRoutes: CollectionPointsRoutes = new CollectionPointsRoutes();
  public collectionsRoutes: CollectionsRoutes = new CollectionsRoutes();
  public weighingsRoutes: WeighingsRoutes = new WeighingsRoutes();
  public settlementsRoutes: SettlementsRoutes = new SettlementsRoutes();
  // Phase II: auth
  public usersRoutes: UsersRoutes = new UsersRoutes();
  public rolesRoutes: RolesRoutes = new RolesRoutes();
  public resourcesRoutes: ResourcesRoutes = new ResourcesRoutes();
  public roleUsersRoutes: RoleUsersRoutes = new RoleUsersRoutes();
  public resourceRolesRoutes: ResourceRolesRoutes = new ResourceRolesRoutes();
  public refreshTokensRoutes: RefreshTokensRoutes = new RefreshTokensRoutes();
  public sessionRoutes: SessionRoutes = new SessionRoutes();
  public archiveRoutes: ArchiveRoutes = new ArchiveRoutes();
}
