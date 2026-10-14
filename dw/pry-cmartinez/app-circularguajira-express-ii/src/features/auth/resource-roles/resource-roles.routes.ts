import { Application } from "express";
import { ResourceRolesController } from "./resource-roles.controller";
import { authenticate, authorize } from "../access";

/**
 * Grant (permission) endpoints (5 operations, no physical delete). Access mode: JWT + RBAC
 * (`authenticate` 401, then `authorize` 403).
 */
export class ResourceRolesRoutes {
  public resourceRolesController: ResourceRolesController = new ResourceRolesController();

  public routes(app: Application): void {
    const controller = this.resourceRolesController;

    // getAll
    app.route("/api/resource-roles").get(authenticate, authorize, controller.getAll.bind(controller));

    // getOne
    app.route("/api/resource-roles/:id").get(authenticate, authorize, controller.getOne.bind(controller));

    // grant (create or reactivate)
    app.route("/api/resource-roles").post(authenticate, authorize, controller.grant.bind(controller));

    // deactivate (revoke, logical)
    app.route("/api/resource-roles/:id/deactivate").patch(authenticate, authorize, controller.deactivate.bind(controller));

    // reactivate
    app.route("/api/resource-roles/:id/reactivate").patch(authenticate, authorize, controller.reactivate.bind(controller));
  }
}
