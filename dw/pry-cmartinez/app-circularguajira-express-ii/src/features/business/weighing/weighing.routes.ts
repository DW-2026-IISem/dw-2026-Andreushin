import { Application } from "express";
import { authenticate, authorize } from "../../auth/access";
import { CollectionsController } from "./collections.controller";
import { WeighingsController } from "./weighings.controller";

// Express endpoints of the weighing feature (collections + their weighings).
export class WeighingRoutes {
  public collectionsController: CollectionsController = new CollectionsController();
  public weighingsController: WeighingsController = new WeighingsController();

  public routes(app: Application): void {
    // JWT + RBAC: authenticate (401) -> authorize (403, deny by default) -> controller
    const collections = this.collectionsController;
    const weighings = this.weighingsController;

    // ---------- collections ----------

    // getAll
    app.route("/api/collections").get(authenticate, authorize, collections.getAll.bind(collections));

    // getOne
    app.route("/api/collections/:id").get(authenticate, authorize, collections.getOne.bind(collections));

    // create (header + weighings, transactional)
    app.route("/api/collections").post(authenticate, authorize, collections.create.bind(collections));

    // update (PUT / PATCH) of the header
    app
      .route("/api/collections/:id")
      .put(authenticate, authorize, collections.update.bind(collections))
      .patch(authenticate, authorize, collections.patch.bind(collections));

    // delete (físico)
    app.route("/api/collections/:id").delete(authenticate, authorize, collections.delete.bind(collections));

    // deactivate (lógico)
    app.route("/api/collections/:id/deactivate").patch(authenticate, authorize, collections.deactivate.bind(collections));

    // ---------- weighings ----------

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
