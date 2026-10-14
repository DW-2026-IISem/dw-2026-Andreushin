import { Application } from "express";
import { MaterialsController } from "./materials.controller";
import { MaterialRatesController } from "./material-rates.controller";

export class MaterialsRoutes {
  public materialsController: MaterialsController = new MaterialsController();
  public materialRatesController: MaterialRatesController = new MaterialRatesController();

  public routes(app: Application): void {
    // ================== RUTAS SIN AUTENTICACIÓN / SIN MIDDLEWARE JWT ==================

    // getAll
    app
      .route("/api/materials")
      .get(this.materialsController.getAll.bind(this.materialsController));

    // getOne
    app
      .route("/api/materials/:id")
      .get(this.materialsController.getOne.bind(this.materialsController));

    // create
    app
      .route("/api/materials")
      .post(this.materialsController.create.bind(this.materialsController));

    // update (PUT / PATCH)
    app
      .route("/api/materials/:id")
      .put(this.materialsController.update.bind(this.materialsController))
      .patch(this.materialsController.patch.bind(this.materialsController));

    // delete (físico)
    app
      .route("/api/materials/:id")
      .delete(this.materialsController.delete.bind(this.materialsController));

    // deactivate (lógico)
    app
      .route("/api/materials/:id/deactivate")
      .patch(this.materialsController.deactivate.bind(this.materialsController));

    // rates: history + new period
    app
      .route("/api/materials/:id/rates")
      .get(this.materialRatesController.getHistory.bind(this.materialRatesController))
      .post(this.materialRatesController.create.bind(this.materialRatesController));

    // rates: applicable rate on a date (?date=YYYY-MM-DD, today by default)
    app
      .route("/api/materials/:id/rates/current")
      .get(this.materialRatesController.getApplicable.bind(this.materialRatesController));
  }
}
