import { Application } from "express";
import { RefreshTokensController } from "./refresh-tokens.controller";
import { authenticate } from "../access";

/**
 * Own sessions endpoints. Access mode: JWT only (`authenticate`, 401), no `authorize`:
 * seeing and revoking your own sessions comes from being authenticated, not from a grant,
 * so these operations are not catalog resources.
 */
export class RefreshTokensRoutes {
  public refreshTokensController: RefreshTokensController = new RefreshTokensController();

  public routes(app: Application): void {
    const sessions = this.refreshTokensController;

    // getAll (active sessions of the caller)
    app.route("/api/sessions").get(authenticate, sessions.getAll.bind(sessions));

    // deactivate all (literal path, registered before the :id routes)
    app.route("/api/sessions/deactivate-all").patch(authenticate, sessions.deactivateAll.bind(sessions));

    // getOne
    app.route("/api/sessions/:id").get(authenticate, sessions.getOne.bind(sessions));

    // deactivate one (logical revoke)
    app.route("/api/sessions/:id/deactivate").patch(authenticate, sessions.deactivate.bind(sessions));

    // purge (physical delete of revoked or expired sessions of the caller)
    app.route("/api/sessions").delete(authenticate, sessions.purge.bind(sessions));
  }
}
