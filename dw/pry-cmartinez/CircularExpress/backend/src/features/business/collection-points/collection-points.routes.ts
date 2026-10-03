import { Application } from "express";
import { CollectionPointsController } from "./collection-points.controller";

export class CollectionPointsRoutes {
  private readonly controller = new CollectionPointsController();

  public routes(app: Application): void {
    app
      .route("/api/collection-points")
      .get(this.controller.getAll.bind(this.controller))
      .post(this.controller.create.bind(this.controller));

    app
      .route("/api/collection-points/:id")
      .get(this.controller.getOne.bind(this.controller))
      .put(this.controller.updatePut.bind(this.controller))
      .patch(this.controller.updatePatch.bind(this.controller))
      .delete(this.controller.deletePhysical.bind(this.controller));

    // Logical delete: sets status to "inactive" instead of removing the row.
    app
      .route("/api/collection-points/:id/deactivate")
      .patch(this.controller.deleteLogical.bind(this.controller));
  }
}
