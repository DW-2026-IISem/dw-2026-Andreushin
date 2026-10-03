import { RecyclersRoutes } from "../features/business/recyclers/recyclers.routes";

// Aggregator: one <Plural>Routes instance per feature, registered from App.routes().
export class Routes {
  public recyclersRoutes: RecyclersRoutes = new RecyclersRoutes();
}
