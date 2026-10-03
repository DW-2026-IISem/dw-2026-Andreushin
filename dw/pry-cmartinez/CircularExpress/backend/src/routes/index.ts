import { RecyclersRoutes } from "../features/business/recyclers/recyclers.routes";
import { RoutesRoutes } from "../features/business/routes/routes.routes";
import { CollectionPointsRoutes } from "../features/business/collection-points/collection-points.routes";
import { CollectionsRoutes } from "../features/business/collections/collections.routes";
import { MaterialsRoutes } from "../features/business/materials/materials.routes";

// Aggregator: one <Plural>Routes instance per feature, registered from App.routes().
export class Routes {
  public recyclersRoutes: RecyclersRoutes = new RecyclersRoutes();
  public routesRoutes: RoutesRoutes = new RoutesRoutes();
  public collectionPointsRoutes: CollectionPointsRoutes = new CollectionPointsRoutes();
  public collectionsRoutes: CollectionsRoutes = new CollectionsRoutes();
  public materialsRoutes: MaterialsRoutes = new MaterialsRoutes();
}
