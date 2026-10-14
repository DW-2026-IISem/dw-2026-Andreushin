import { Application } from "express";
import { CollectionsController } from "./collections.controller";
import { WeighingsController } from "./weighings.controller";

// Express endpoints of the weighing feature (collections + their weighings).
export class WeighingRoutes {
  public collectionsController: CollectionsController = new CollectionsController();
  public weighingsController: WeighingsController = new WeighingsController();

  public routes(app: Application): void {
    // ================== RUTAS SIN AUTENTICACIÓN / SIN MIDDLEWARE JWT ==================
    const collections = this.collectionsController;
    const weighings = this.weighingsController;

    // ---------- collections ----------

    // getAll
    app.route("/api/collections").get(collections.getAll.bind(collections));

    // getOne
    app.route("/api/collections/:id").get(collections.getOne.bind(collections));

    // create (header + weighings, transactional)
    app.route("/api/collections").post(collections.create.bind(collections));

    // update (PUT / PATCH) of the header
    app
      .route("/api/collections/:id")
      .put(collections.update.bind(collections))
      .patch(collections.patch.bind(collections));

    // delete (físico)
    app.route("/api/collections/:id").delete(collections.delete.bind(collections));

    // deactivate (lógico)
    app.route("/api/collections/:id/deactivate").patch(collections.deactivate.bind(collections));

    // ---------- weighings ----------

    // getAll
    app.route("/api/weighings").get(weighings.getAll.bind(weighings));

    // getOne
    app.route("/api/weighings/:id").get(weighings.getOne.bind(weighings));

    // create (adds a line to an open collection)
    app.route("/api/weighings").post(weighings.create.bind(weighings));

    // update (PUT / PATCH) of the weights
    app
      .route("/api/weighings/:id")
      .put(weighings.update.bind(weighings))
      .patch(weighings.patch.bind(weighings));

    // delete (físico)
    app.route("/api/weighings/:id").delete(weighings.delete.bind(weighings));

    // deactivate (lógico)
    app.route("/api/weighings/:id/deactivate").patch(weighings.deactivate.bind(weighings));
  }
}
