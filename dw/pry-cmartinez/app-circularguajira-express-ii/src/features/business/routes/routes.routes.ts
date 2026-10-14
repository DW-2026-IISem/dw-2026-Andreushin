import { Application } from "express";
import { authenticate, authorize } from "../../auth/access";
import { RoutesController } from "./routes.controller";
import { CollectionPointsController } from "./collection-points.controller";

// Express endpoints of the routes feature (collection routes + their collection points).
export class RoutesRoutes {
  public routesController: RoutesController = new RoutesController();
  public collectionPointsController: CollectionPointsController = new CollectionPointsController();

  public routes(app: Application): void {
    // JWT + RBAC: authenticate (401) -> authorize (403, deny by default) -> controller

    // ---------- collection routes ----------

    // getAll
    app.route("/api/routes").get(authenticate, authorize, this.routesController.getAll.bind(this.routesController));

    // getOne
    app.route("/api/routes/:id").get(authenticate, authorize, this.routesController.getOne.bind(this.routesController));

    // create
    app.route("/api/routes").post(authenticate, authorize, this.routesController.create.bind(this.routesController));

    // update (PUT / PATCH)
    app
      .route("/api/routes/:id")
      .put(authenticate, authorize, this.routesController.update.bind(this.routesController))
      .patch(authenticate, authorize, this.routesController.patch.bind(this.routesController));

    // delete (físico)
    app.route("/api/routes/:id").delete(authenticate, authorize, this.routesController.delete.bind(this.routesController));

    // deactivate (lógico)
    app
      .route("/api/routes/:id/deactivate")
      .patch(authenticate, authorize, this.routesController.deactivate.bind(this.routesController));

    // points of a route, in visit order
    app
      .route("/api/routes/:id/points")
      .get(authenticate, authorize, this.collectionPointsController.getByRoute.bind(this.collectionPointsController));

    // ---------- collection points ----------

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
