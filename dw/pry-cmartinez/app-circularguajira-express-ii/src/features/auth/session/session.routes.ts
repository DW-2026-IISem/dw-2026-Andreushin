import { Application } from "express";
import { SessionController } from "./session.controller";
import { authenticate } from "../access";

/**
 * Session endpoints, two access modes side by side (JWT + RBAC is the rest of the API):
 *   OPEN  POST /api/session/login | refresh | logout   no identity yet; credential in the body
 *   JWT   GET  /api/session/profile | permissions      `authenticate` (401)
 * None takes `authorize`: they come before (or are about) the permission matrix, so they
 * are not catalog resources.
 */
export class SessionRoutes {
  public sessionController: SessionController = new SessionController();

  public routes(app: Application): void {
    const session = this.sessionController;

    // login (OPEN)
    app.route("/api/session/login").post(session.login.bind(session));

    // refresh: rotates the refresh token (OPEN + refresh token)
    app.route("/api/session/refresh").post(session.refresh.bind(session));

    // logout: revokes the refresh token (OPEN + refresh token)
    app.route("/api/session/logout").post(session.logout.bind(session));

    // profile with active roles (JWT)
    app.route("/api/session/profile").get(authenticate, session.profile.bind(session));

    // own effective permissions, the same query as `authorize` (JWT)
    app.route("/api/session/permissions").get(authenticate, session.permissions.bind(session));
  }
}
