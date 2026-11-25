import { Application } from "express";
import { authenticate, authorize } from "../../../../auth/access";
import { CollectionsController } from "./collections.controller";

// Express endpoints of the collections table.
export class CollectionsRoutes {
  public collectionsController: CollectionsController = new CollectionsController();

  public routes(app: Application): void {
    // JWT + RBAC: authenticate (401) -> authorize (403, deny by default) -> controller
    const collections = this.collectionsController;

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
  }
}
