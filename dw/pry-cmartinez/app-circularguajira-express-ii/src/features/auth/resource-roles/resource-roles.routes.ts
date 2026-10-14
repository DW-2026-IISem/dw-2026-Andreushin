import { Application } from "express";
import { ResourceRolesController } from "./resource-roles.controller";
import { authenticate } from "../access/authenticate";

/**
 * Grant (permission) endpoints (5 operations, no physical delete). Access mode now: JWT
 * (`authenticate`); ISS-13 chains `authorize` (JWT + RBAC).
 */
export class ResourceRolesRoutes {
  public resourceRolesController: ResourceRolesController = new ResourceRolesController();

  public routes(app: Application): void {
    const controller = this.resourceRolesController;

    // getAll
    app.route("/api/resource-roles").get(authenticate, controller.getAll.bind(controller));

    // getOne
    app.route("/api/resource-roles/:id").get(authenticate, controller.getOne.bind(controller));

    // grant (create or reactivate)
    app.route("/api/resource-roles").post(authenticate, controller.grant.bind(controller));

    // deactivate (revoke, logical)
    app.route("/api/resource-roles/:id/deactivate").patch(authenticate, controller.deactivate.bind(controller));

    // reactivate
    app.route("/api/resource-roles/:id/reactivate").patch(authenticate, controller.reactivate.bind(controller));
  }
}
