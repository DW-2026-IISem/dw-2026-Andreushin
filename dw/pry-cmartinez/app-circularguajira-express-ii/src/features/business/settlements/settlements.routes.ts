import { Application } from "express";
import { authenticate, authorize } from "../../auth/access";
import { SettlementsController } from "./settlements.controller";

export class SettlementsRoutes {
  public settlementsController: SettlementsController = new SettlementsController();

  public routes(app: Application): void {
    // JWT + RBAC: authenticate (401) -> authorize (403, deny by default) -> controller
    const settlements = this.settlementsController;

    // getAll
    app.route("/api/settlements").get(authenticate, authorize, settlements.getAll.bind(settlements));

    // getOne (with the collection and the weighings it paid)
    app.route("/api/settlements/:id").get(authenticate, authorize, settlements.getOne.bind(settlements));

    // verify: recompute from the stored references
    app.route("/api/settlements/:id/verify").get(authenticate, authorize, settlements.verify.bind(settlements));

    // create (settles one collection, transactional)
    app.route("/api/settlements").post(authenticate, authorize, settlements.create.bind(settlements));

    // update (PUT / PATCH): notes only
    app
      .route("/api/settlements/:id")
      .put(authenticate, authorize, settlements.update.bind(settlements))
      .patch(authenticate, authorize, settlements.patch.bind(settlements));

    // delete (físico, solo anuladas)
    app.route("/api/settlements/:id").delete(authenticate, authorize, settlements.delete.bind(settlements));

    // void (lógico): status = voided, the collection reopens
    app.route("/api/settlements/:id/void").patch(authenticate, authorize, settlements.void.bind(settlements));
  }
}
