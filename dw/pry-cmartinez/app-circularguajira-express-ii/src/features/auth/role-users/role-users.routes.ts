import { Application } from "express";
import { RoleUsersController } from "./role-users.controller";
import { authenticate, authorize } from "../access";

/**
 * Role assignment endpoints (5 operations, no physical delete). Access mode: JWT + RBAC
 * (`authenticate` 401, then `authorize` 403).
 */
export class RoleUsersRoutes {
  public roleUsersController: RoleUsersController = new RoleUsersController();

  public routes(app: Application): void {
    const controller = this.roleUsersController;

    // getAll
    app.route("/api/role-users").get(authenticate, authorize, controller.getAll.bind(controller));

    // getOne
    app.route("/api/role-users/:id").get(authenticate, authorize, controller.getOne.bind(controller));

    // assign (create or reactivate)
    app.route("/api/role-users").post(authenticate, authorize, controller.assign.bind(controller));

    // deactivate (revoke, logical)
    app.route("/api/role-users/:id/deactivate").patch(authenticate, authorize, controller.deactivate.bind(controller));

    // reactivate
    app.route("/api/role-users/:id/reactivate").patch(authenticate, authorize, controller.reactivate.bind(controller));
  }
}
