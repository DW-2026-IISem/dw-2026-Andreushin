import { Application } from "express";
import { RoutesController } from "./routes.controller";
import { CollectionPointsController } from "./collection-points.controller";

// Express endpoints of the routes feature (collection routes + their collection points).
export class RoutesRoutes {
  public routesController: RoutesController = new RoutesController();
  public collectionPointsController: CollectionPointsController = new CollectionPointsController();

  public routes(app: Application): void {
    // ================== RUTAS SIN AUTENTICACIÓN / SIN MIDDLEWARE JWT ==================

    // ---------- collection routes ----------

    // getAll
    app.route("/api/routes").get(this.routesController.getAll.bind(this.routesController));

    // getOne
    app.route("/api/routes/:id").get(this.routesController.getOne.bind(this.routesController));

    // create
    app.route("/api/routes").post(this.routesController.create.bind(this.routesController));

    // update (PUT / PATCH)
    app
      .route("/api/routes/:id")
      .put(this.routesController.update.bind(this.routesController))
      .patch(this.routesController.patch.bind(this.routesController));

    // delete (físico)
    app.route("/api/routes/:id").delete(this.routesController.delete.bind(this.routesController));

    // deactivate (lógico)
    app
      .route("/api/routes/:id/deactivate")
      .patch(this.routesController.deactivate.bind(this.routesController));

    // points of a route, in visit order
    app
      .route("/api/routes/:id/points")
      .get(this.collectionPointsController.getByRoute.bind(this.collectionPointsController));

    // ---------- collection points ----------

    // getAll
    app
      .route("/api/collection-points")
      .get(this.collectionPointsController.getAll.bind(this.collectionPointsController));

    // getOne
    app
      .route("/api/collection-points/:id")
      .get(this.collectionPointsController.getOne.bind(this.collectionPointsController));

    // create
    app
      .route("/api/collection-points")
      .post(this.collectionPointsController.create.bind(this.collectionPointsController));

    // update (PUT / PATCH)
    app
      .route("/api/collection-points/:id")
      .put(this.collectionPointsController.update.bind(this.collectionPointsController))
      .patch(this.collectionPointsController.patch.bind(this.collectionPointsController));

    // delete (físico)
    app
      .route("/api/collection-points/:id")
      .delete(this.collectionPointsController.delete.bind(this.collectionPointsController));

    // deactivate (lógico)
    app
      .route("/api/collection-points/:id/deactivate")
      .patch(this.collectionPointsController.deactivate.bind(this.collectionPointsController));
  }
}
