import { Application } from "express";
import { UsersController } from "./users.controller";
import { authenticate, authorize } from "../access";

/**
 * Users endpoints. Access mode: JWT + RBAC (`authenticate` 401, then `authorize` 403);
 * the catalog grants them to ADMIN only.
 */
export class UsersRoutes {
  public usersController: UsersController = new UsersController();

  public routes(app: Application): void {
    const users = this.usersController;

    // getAll
    app.route("/api/users").get(authenticate, authorize, users.getAll.bind(users));

    // getOne
    app.route("/api/users/:id").get(authenticate, authorize, users.getOne.bind(users));

    // create
    app.route("/api/users").post(authenticate, authorize, users.create.bind(users));

    // update (PUT / PATCH)
    app
      .route("/api/users/:id")
      .put(authenticate, authorize, users.update.bind(users))
      .patch(authenticate, authorize, users.patch.bind(users));

    // delete (físico)
    app.route("/api/users/:id").delete(authenticate, authorize, users.delete.bind(users));

    // deactivate (lógico)
    app.route("/api/users/:id/deactivate").patch(authenticate, authorize, users.deactivate.bind(users));

    // change password (requires the current one)
    app.route("/api/users/:id/password").patch(authenticate, authorize, users.changePassword.bind(users));

    // effective permissions (RBAC chain)
    app.route("/api/users/:id/permissions").get(authenticate, authorize, users.getEffectivePermissions.bind(users));
  }
}
