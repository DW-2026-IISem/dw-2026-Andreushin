import { Application } from "express";
import { RolesController } from "./roles.controller";
import { authenticate } from "../access/authenticate";

/**
 * Roles endpoints. Access mode now: JWT (`authenticate`); ISS-13 chains `authorize`
 * (JWT + RBAC) after it.
 */
export class RolesRoutes {
  public rolesController: RolesController = new RolesController();

  public routes(app: Application): void {
    const controller = this.rolesController;

    // getAll
    app.route("/api/roles").get(authenticate, controller.getAll.bind(controller));

    // getOne
    app.route("/api/roles/:id").get(authenticate, controller.getOne.bind(controller));

    // create
    app.route("/api/roles").post(authenticate, controller.create.bind(controller));

    // update (PUT / PATCH)
    app
      .route("/api/roles/:id")
      .put(authenticate, controller.update.bind(controller))
      .patch(authenticate, controller.patch.bind(controller));

    // delete (físico)
    app.route("/api/roles/:id").delete(authenticate, controller.delete.bind(controller));

    // deactivate (lógico)
    app.route("/api/roles/:id/deactivate").patch(authenticate, controller.deactivate.bind(controller));
  }
}
