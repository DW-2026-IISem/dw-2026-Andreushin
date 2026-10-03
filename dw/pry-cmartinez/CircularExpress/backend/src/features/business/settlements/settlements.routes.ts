import { Application } from "express";
import { SettlementsController } from "./settlements.controller";

export class SettlementsRoutes {
  private readonly controller = new SettlementsController();

  public routes(app: Application): void {
    app
      .route("/api/settlements")
      .get(this.controller.getAll.bind(this.controller))
      .post(this.controller.create.bind(this.controller));

    app
      .route("/api/settlements/:id")
      .get(this.controller.getOne.bind(this.controller))
      .put(this.controller.updatePut.bind(this.controller))
      .patch(this.controller.updatePatch.bind(this.controller))
      .delete(this.controller.deletePhysical.bind(this.controller));

    // Logical delete (void): only pending or rejected settlements.
    app.route("/api/settlements/:id/deactivate").patch(this.controller.deleteLogical.bind(this.controller));
  }
}
