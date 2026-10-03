import { Application } from "express";
import { WeighingsController } from "./weighings.controller";

export class WeighingsRoutes {
  private readonly controller = new WeighingsController();

  public routes(app: Application): void {
    app
      .route("/api/weighings")
      .get(this.controller.getAll.bind(this.controller))
      .post(this.controller.create.bind(this.controller));

    app
      .route("/api/weighings/:id")
      .get(this.controller.getOne.bind(this.controller))
      .put(this.controller.updatePut.bind(this.controller))
      .patch(this.controller.updatePatch.bind(this.controller))
      .delete(this.controller.deletePhysical.bind(this.controller));

    // Logical delete (void): sets status to "inactive" and removes its net weight from the lot.
    app.route("/api/weighings/:id/deactivate").patch(this.controller.deleteLogical.bind(this.controller));
  }
}
