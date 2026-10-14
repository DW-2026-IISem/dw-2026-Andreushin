import { Application } from "express";
import { RoleUsersController } from "./role-users.controller";
import { authenticate } from "../access/authenticate";

/**
 * Role assignment endpoints (5 operations, no physical delete). Access mode now: JWT
 * (`authenticate`); ISS-13 chains `authorize` (JWT + RBAC).
 */
export class RoleUsersRoutes {
  public roleUsersController: RoleUsersController = new RoleUsersController();

  public routes(app: Application): void {
    const controller = this.roleUsersController;

    // getAll
    app.route("/api/role-users").get(authenticate, controller.getAll.bind(controller));

    // getOne
    app.route("/api/role-users/:id").get(authenticate, controller.getOne.bind(controller));

    // assign (create or reactivate)
    app.route("/api/role-users").post(authenticate, controller.assign.bind(controller));

    // deactivate (revoke, logical)
    app.route("/api/role-users/:id/deactivate").patch(authenticate, controller.deactivate.bind(controller));

    // reactivate
    app.route("/api/role-users/:id/reactivate").patch(authenticate, controller.reactivate.bind(controller));
  }
}
