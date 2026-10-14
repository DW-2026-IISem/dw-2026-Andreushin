import { Application } from "express";
import { RolesController } from "./roles.controller";
import { authenticate, authorize } from "../access";

/**
 * Roles endpoints. Access mode: JWT + RBAC (`authenticate` 401, then `authorize` 403).
 */
export class RolesRoutes {
  public rolesController: RolesController = new RolesController();

  public routes(app: Application): void {
    const controller = this.rolesController;

    // getAll
    app.route("/api/roles").get(authenticate, authorize, controller.getAll.bind(controller));

    // getOne
    app.route("/api/roles/:id").get(authenticate, authorize, controller.getOne.bind(controller));

    // create
    app.route("/api/roles").post(authenticate, authorize, controller.create.bind(controller));

    // update (PUT / PATCH)
    app
      .route("/api/roles/:id")
      .put(authenticate, authorize, controller.update.bind(controller))
      .patch(authenticate, authorize, controller.patch.bind(controller));

    // delete (físico)
    app.route("/api/roles/:id").delete(authenticate, authorize, controller.delete.bind(controller));

    // deactivate (lógico)
    app.route("/api/roles/:id/deactivate").patch(authenticate, authorize, controller.deactivate.bind(controller));
  }
}
