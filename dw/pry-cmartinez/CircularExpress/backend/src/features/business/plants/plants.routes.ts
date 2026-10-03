import { Application } from "express";
import { PlantsController } from "./plants.controller";

export class PlantsRoutes {
  private readonly controller = new PlantsController();

  public routes(app: Application): void {
    app
      .route("/api/plants")
      .get(this.controller.getAll.bind(this.controller))
      .post(this.controller.create.bind(this.controller));

    app
      .route("/api/plants/:id")
      .get(this.controller.getOne.bind(this.controller))
      .put(this.controller.updatePut.bind(this.controller))
      .patch(this.controller.updatePatch.bind(this.controller))
      .delete(this.controller.deletePhysical.bind(this.controller));

    // Logical delete: sets status to "inactive" instead of removing the row.
    app.route("/api/plants/:id/deactivate").patch(this.controller.deleteLogical.bind(this.controller));
  }
}
