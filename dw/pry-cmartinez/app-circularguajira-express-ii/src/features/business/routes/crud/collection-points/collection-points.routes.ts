import { Application } from "express";
import { authenticate, authorize } from "../../../../auth/access";
import { CollectionPointsController } from "./collection-points.controller";

// Express endpoints of the collection_points table.
export class CollectionPointsRoutes {
  public collectionPointsController: CollectionPointsController = new CollectionPointsController();

  public routes(app: Application): void {
    // JWT + RBAC: authenticate (401) -> authorize (403, deny by default) -> controller
    // points of a route, in visit order
    app
      .route("/api/routes/:id/points")
      .get(authenticate, authorize, this.collectionPointsController.getByRoute.bind(this.collectionPointsController));

    // getAll
    app
      .route("/api/collection-points")
      .get(authenticate, authorize, this.collectionPointsController.getAll.bind(this.collectionPointsController));

    // getOne
    app
      .route("/api/collection-points/:id")
      .get(authenticate, authorize, this.collectionPointsController.getOne.bind(this.collectionPointsController));

    // create
    app
      .route("/api/collection-points")
      .post(authenticate, authorize, this.collectionPointsController.create.bind(this.collectionPointsController));

    // update (PUT / PATCH)
    app
      .route("/api/collection-points/:id")
      .put(authenticate, authorize, this.collectionPointsController.update.bind(this.collectionPointsController))
      .patch(authenticate, authorize, this.collectionPointsController.patch.bind(this.collectionPointsController));

    // delete (físico)
    app
      .route("/api/collection-points/:id")
      .delete(authenticate, authorize, this.collectionPointsController.delete.bind(this.collectionPointsController));

    // deactivate (lógico)
    app
      .route("/api/collection-points/:id/deactivate")
      .patch(authenticate, authorize, this.collectionPointsController.deactivate.bind(this.collectionPointsController));
  }
}
