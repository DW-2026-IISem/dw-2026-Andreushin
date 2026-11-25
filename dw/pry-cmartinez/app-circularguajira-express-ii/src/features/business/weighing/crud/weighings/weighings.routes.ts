import { Application } from "express";
import { authenticate, authorize } from "../../../../auth/access";
import { WeighingsController } from "./weighings.controller";

// Express endpoints of the weighings table.
export class WeighingsRoutes {
  public weighingsController: WeighingsController = new WeighingsController();

  public routes(app: Application): void {
    // JWT + RBAC: authenticate (401) -> authorize (403, deny by default) -> controller
    const weighings = this.weighingsController;

    // getAll
    app.route("/api/weighings").get(authenticate, authorize, weighings.getAll.bind(weighings));

    // getOne
    app.route("/api/weighings/:id").get(authenticate, authorize, weighings.getOne.bind(weighings));

    // create (adds a line to an open collection)
    app.route("/api/weighings").post(authenticate, authorize, weighings.create.bind(weighings));

    // update (PUT / PATCH) of the weights
    app
      .route("/api/weighings/:id")
      .put(authenticate, authorize, weighings.update.bind(weighings))
      .patch(authenticate, authorize, weighings.patch.bind(weighings));

    // delete (físico)
    app.route("/api/weighings/:id").delete(authenticate, authorize, weighings.delete.bind(weighings));

    // deactivate (lógico)
    app.route("/api/weighings/:id/deactivate").patch(authenticate, authorize, weighings.deactivate.bind(weighings));
  }
}
