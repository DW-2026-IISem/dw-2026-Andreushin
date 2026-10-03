import { RecyclersRoutes } from "../features/business/recyclers/recyclers.routes";
import { RoutesRoutes } from "../features/business/routes/routes.routes";
import { CollectionPointsRoutes } from "../features/business/collection-points/collection-points.routes";
import { CollectionsRoutes } from "../features/business/collections/collections.routes";
import { MaterialsRoutes } from "../features/business/materials/materials.routes";
import { MaterialRatesRoutes } from "../features/business/material-rates/material-rates.routes";
import { PlantsRoutes } from "../features/business/plants/plants.routes";
import { MaterialLotsRoutes } from "../features/business/material-lots/material-lots.routes";
import { WeighingsRoutes } from "../features/business/weighings/weighings.routes";
import { MaterialSalesRoutes } from "../features/business/material-sales/material-sales.routes";
import { SettlementsRoutes } from "../features/business/settlements/settlements.routes";

// Aggregator: one <Plural>Routes instance per feature, registered from App.routes().
export class Routes {
  public recyclersRoutes: RecyclersRoutes = new RecyclersRoutes();
  public routesRoutes: RoutesRoutes = new RoutesRoutes();
  public collectionPointsRoutes: CollectionPointsRoutes = new CollectionPointsRoutes();
  public collectionsRoutes: CollectionsRoutes = new CollectionsRoutes();
  public materialsRoutes: MaterialsRoutes = new MaterialsRoutes();
  public materialRatesRoutes: MaterialRatesRoutes = new MaterialRatesRoutes();
  public plantsRoutes: PlantsRoutes = new PlantsRoutes();
  public materialLotsRoutes: MaterialLotsRoutes = new MaterialLotsRoutes();
  public weighingsRoutes: WeighingsRoutes = new WeighingsRoutes();
  public materialSalesRoutes: MaterialSalesRoutes = new MaterialSalesRoutes();
  public settlementsRoutes: SettlementsRoutes = new SettlementsRoutes();
}
