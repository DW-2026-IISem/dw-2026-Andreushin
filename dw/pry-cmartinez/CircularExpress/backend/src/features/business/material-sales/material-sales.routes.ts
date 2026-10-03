import { Application } from "express";
import { MaterialSalesController } from "./material-sales.controller";

export class MaterialSalesRoutes {
  private readonly controller = new MaterialSalesController();

  public routes(app: Application): void {
    app
      .route("/api/material-sales")
      .get(this.controller.getAll.bind(this.controller))
      .post(this.controller.create.bind(this.controller));

    app
      .route("/api/material-sales/:id")
      .get(this.controller.getOne.bind(this.controller))
      .put(this.controller.updatePut.bind(this.controller))
      .patch(this.controller.updatePatch.bind(this.controller))
      .delete(this.controller.deletePhysical.bind(this.controller));

    // Logical delete (void): sets status to "inactive" and returns the quantity to the lot.
    app.route("/api/material-sales/:id/deactivate").patch(this.controller.deleteLogical.bind(this.controller));
  }
}
