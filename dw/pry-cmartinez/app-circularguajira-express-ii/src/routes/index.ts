import { RecyclersRoutes } from "../features/business/collectors/recyclers.routes";
import { MaterialsRoutes } from "../features/business/materials/materials.routes";

export class Routes {
  public recyclersRoutes: RecyclersRoutes = new RecyclersRoutes();
  public materialsRoutes: MaterialsRoutes = new MaterialsRoutes();
}
