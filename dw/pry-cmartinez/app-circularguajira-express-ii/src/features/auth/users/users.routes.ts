import { Application } from "express";
import { UsersController } from "./users.controller";
import { authenticate } from "../access/authenticate";

/**
 * Users endpoints. Access mode now: JWT (`authenticate`: valid token of an active user,
 * otherwise 401). ISS-13 chains `authorize` after it (JWT + RBAC, 403 without a grant).
 */
export class UsersRoutes {
  public usersController: UsersController = new UsersController();

  public routes(app: Application): void {
    const users = this.usersController;

    // getAll
    app.route("/api/users").get(authenticate, users.getAll.bind(users));

    // getOne
    app.route("/api/users/:id").get(authenticate, users.getOne.bind(users));

    // create
    app.route("/api/users").post(authenticate, users.create.bind(users));

    // update (PUT / PATCH)
    app
      .route("/api/users/:id")
      .put(authenticate, users.update.bind(users))
      .patch(authenticate, users.patch.bind(users));

    // delete (físico)
    app.route("/api/users/:id").delete(authenticate, users.delete.bind(users));

    // deactivate (lógico)
    app.route("/api/users/:id/deactivate").patch(authenticate, users.deactivate.bind(users));

    // change password (requires the current one)
    app.route("/api/users/:id/password").patch(authenticate, users.changePassword.bind(users));

    // effective permissions (RBAC chain)
    app.route("/api/users/:id/permissions").get(authenticate, users.getEffectivePermissions.bind(users));
  }
}
