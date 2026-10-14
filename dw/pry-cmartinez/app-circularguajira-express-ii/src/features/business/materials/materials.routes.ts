import { Application } from "express";
import { authenticate, authorize } from "../../auth/access";
import { MaterialsController } from "./materials.controller";
import { MaterialRatesController } from "./material-rates.controller";

export class MaterialsRoutes {
  public materialsController: MaterialsController = new MaterialsController();
  public materialRatesController: MaterialRatesController = new MaterialRatesController();

  public routes(app: Application): void {
    // JWT + RBAC: authenticate (401) -> authorize (403, deny by default) -> controller

    // getAll
    app
      .route("/api/materials")
      .get(authenticate, authorize, this.materialsController.getAll.bind(this.materialsController));

    // getOne
    app
      .route("/api/materials/:id")
      .get(authenticate, authorize, this.materialsController.getOne.bind(this.materialsController));

    // create
    app
      .route("/api/materials")
      .post(authenticate, authorize, this.materialsController.create.bind(this.materialsController));

    // update (PUT / PATCH)
    app
      .route("/api/materials/:id")
      .put(authenticate, authorize, this.materialsController.update.bind(this.materialsController))
      .patch(authenticate, authorize, this.materialsController.patch.bind(this.materialsController));

    // delete (físico)
    app
      .route("/api/materials/:id")
      .delete(authenticate, authorize, this.materialsController.delete.bind(this.materialsController));

    // deactivate (lógico)
    app
      .route("/api/materials/:id/deactivate")
      .patch(authenticate, authorize, this.materialsController.deactivate.bind(this.materialsController));

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
