import { Application } from "express";
import { authenticate, authorize } from "../../auth/access";
import { RecyclersController } from "./recyclers.controller";

export class RecyclersRoutes {
  public recyclersController: RecyclersController = new RecyclersController();

  public routes(app: Application): void {
    // JWT + RBAC: authenticate (401) -> authorize (403, deny by default) -> controller

    // getAll
    app
      .route("/api/recyclers")
      .get(authenticate, authorize, this.recyclersController.getAll.bind(this.recyclersController));

    // getOne
    app
      .route("/api/recyclers/:id")
      .get(authenticate, authorize, this.recyclersController.getOne.bind(this.recyclersController));

    // create
    app
      .route("/api/recyclers")
      .post(authenticate, authorize, this.recyclersController.create.bind(this.recyclersController));

    // update (PUT / PATCH)
    app
      .route("/api/recyclers/:id")
      .put(authenticate, authorize, this.recyclersController.update.bind(this.recyclersController))
      .patch(authenticate, authorize, this.recyclersController.patch.bind(this.recyclersController));

    // delete (físico)
    app
      .route("/api/recyclers/:id")
      .delete(authenticate, authorize, this.recyclersController.delete.bind(this.recyclersController));

    // deactivate (lógico)
    app
      .route("/api/recyclers/:id/deactivate")
      .patch(authenticate, authorize, this.recyclersController.deactivate.bind(this.recyclersController));
  }
}
