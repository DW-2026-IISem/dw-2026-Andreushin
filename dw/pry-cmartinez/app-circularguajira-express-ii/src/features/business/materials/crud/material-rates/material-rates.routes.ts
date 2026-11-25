import { Application } from "express";
import { authenticate, authorize } from "../../../../auth/access";
import { MaterialRatesController } from "./material-rates.controller";

// Express endpoints of the material_rates table (nested under /api/materials/:id).
export class MaterialRatesRoutes {
  public materialRatesController: MaterialRatesController = new MaterialRatesController();

  public routes(app: Application): void {
    // JWT + RBAC: authenticate (401) -> authorize (403, deny by default) -> controller
    // rates: history + new period
    app
      .route("/api/materials/:id/rates")
      .get(authenticate, authorize, this.materialRatesController.getHistory.bind(this.materialRatesController))
      .post(authenticate, authorize, this.materialRatesController.create.bind(this.materialRatesController));

    // rates: applicable rate on a date (?date=YYYY-MM-DD, today by default)
    app
      .route("/api/materials/:id/rates/current")
      .get(authenticate, authorize, this.materialRatesController.getApplicable.bind(this.materialRatesController));
  }
}
