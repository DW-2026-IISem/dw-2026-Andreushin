import { Application } from "express";
import { authenticate, authorize } from "../../../../auth/access";
import { RoutesController } from "./routes.controller";

// Express endpoints of the routes feature (collection routes table).
export class RoutesRoutes {
  public routesController: RoutesController = new RoutesController();

  public routes(app: Application): void {
    // JWT + RBAC: authenticate (401) -> authorize (403, deny by default) -> controller

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
  }
}
