import { Application } from "express";
import { RecyclersController } from "./recyclers.controller";

export class RecyclersRoutes {
  private readonly controller = new RecyclersController();

  public routes(app: Application): void {
    app
      .route("/api/recyclers")
      .get(this.controller.getAll.bind(this.controller))
      .post(this.controller.create.bind(this.controller));

    app
      .route("/api/recyclers/:id")
      .get(this.controller.getOne.bind(this.controller))
      .put(this.controller.updatePut.bind(this.controller))
      .patch(this.controller.updatePatch.bind(this.controller))
      .delete(this.controller.deletePhysical.bind(this.controller));

    // Logical delete: sets status to "inactive" instead of removing the row.
    app.route("/api/recyclers/:id/deactivate").patch(this.controller.deleteLogical.bind(this.controller));
  }
}
