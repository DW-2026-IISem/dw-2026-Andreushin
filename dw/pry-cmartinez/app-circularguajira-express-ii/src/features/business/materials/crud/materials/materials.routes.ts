import { Application } from "express";
import { authenticate, authorize } from "../../../../auth/access";
import { MaterialsController } from "./materials.controller";

export class MaterialsRoutes {
  public materialsController: MaterialsController = new MaterialsController();

  public routes(app: Application): void {
    // JWT + RBAC: authenticate (401) -> authorize (403, deny by default) -> controller

    // getAll
    app
      .route("/api/materials")
      .get(authenticate, authorize, this.materialsController.getAll.bind(this.materialsController));

    // getOne
    app
      .route("/api/materials/:id")
      .get(authenticate, authorize, this.materialsController.getOne.bind(this.materialsController));

    // create
    app
      .route("/api/materials")
      .post(authenticate, authorize, this.materialsController.create.bind(this.materialsController));

    // update (PUT / PATCH)
    app
      .route("/api/materials/:id")
      .put(authenticate, authorize, this.materialsController.update.bind(this.materialsController))
      .patch(authenticate, authorize, this.materialsController.patch.bind(this.materialsController));

    // delete (físico)
    app
      .route("/api/materials/:id")
      .delete(authenticate, authorize, this.materialsController.delete.bind(this.materialsController));

    // deactivate (lógico)
    app
      .route("/api/materials/:id/deactivate")
      .patch(authenticate, authorize, this.materialsController.deactivate.bind(this.materialsController));
  }
}
