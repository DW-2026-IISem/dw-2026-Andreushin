import { Application } from "express";
import { MaterialRatesController } from "./material-rates.controller";

export class MaterialRatesRoutes {
  private readonly controller = new MaterialRatesController();

  public routes(app: Application): void {
    app
      .route("/api/material-rates")
      .get(this.controller.getAll.bind(this.controller))
      .post(this.controller.create.bind(this.controller));

    app
      .route("/api/material-rates/:id")
      .get(this.controller.getOne.bind(this.controller))
      .put(this.controller.updatePut.bind(this.controller))
      .patch(this.controller.updatePatch.bind(this.controller))
      .delete(this.controller.deletePhysical.bind(this.controller));

    // Logical delete: sets status to "inactive" instead of removing the row.
    app.route("/api/material-rates/:id/deactivate").patch(this.controller.deleteLogical.bind(this.controller));
  }
}
