import { Application } from "express";
import { MaterialLotsController } from "./material-lots.controller";

export class MaterialLotsRoutes {
  private readonly controller = new MaterialLotsController();

  public routes(app: Application): void {
    app
      .route("/api/material-lots")
      .get(this.controller.getAll.bind(this.controller))
      .post(this.controller.create.bind(this.controller));

    app
      .route("/api/material-lots/:id")
      .get(this.controller.getOne.bind(this.controller))
      .put(this.controller.updatePut.bind(this.controller))
      .patch(this.controller.updatePatch.bind(this.controller))
      .delete(this.controller.deletePhysical.bind(this.controller));

    // Logical delete: sets status to "inactive" instead of removing the row.
    app.route("/api/material-lots/:id/deactivate").patch(this.controller.deleteLogical.bind(this.controller));
  }
}
