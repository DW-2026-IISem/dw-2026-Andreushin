import { Application } from "express";
import { SettlementsController } from "./settlements.controller";

export class SettlementsRoutes {
  public settlementsController: SettlementsController = new SettlementsController();

  public routes(app: Application): void {
    // ================== RUTAS SIN AUTENTICACIÓN / SIN MIDDLEWARE JWT ==================
    const settlements = this.settlementsController;

    // getAll
    app.route("/api/settlements").get(settlements.getAll.bind(settlements));

    // getOne (with the collection and the weighings it paid)
    app.route("/api/settlements/:id").get(settlements.getOne.bind(settlements));

    // verify: recompute from the stored references
    app.route("/api/settlements/:id/verify").get(settlements.verify.bind(settlements));

    // create (settles one collection, transactional)
    app.route("/api/settlements").post(settlements.create.bind(settlements));

    // update (PUT / PATCH): notes only
    app
      .route("/api/settlements/:id")
      .put(settlements.update.bind(settlements))
      .patch(settlements.patch.bind(settlements));

    // delete (físico, solo anuladas)
    app.route("/api/settlements/:id").delete(settlements.delete.bind(settlements));

    // void (lógico): status = voided, the collection reopens
    app.route("/api/settlements/:id/void").patch(settlements.void.bind(settlements));
  }
}
