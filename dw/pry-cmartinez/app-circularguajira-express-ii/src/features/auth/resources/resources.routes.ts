import { Application } from "express";
import { ResourcesController } from "./resources.controller";
import { authenticate, authorize } from "../access";

/**
 * Resources endpoints. Access mode: JWT + RBAC (`authenticate` 401, then `authorize` 403).
 */
export class ResourcesRoutes {
  public resourcesController: ResourcesController = new ResourcesController();

  public routes(app: Application): void {
    const controller = this.resourcesController;

    // getAll
    app.route("/api/resources").get(authenticate, authorize, controller.getAll.bind(controller));

    // getOne
    app.route("/api/resources/:id").get(authenticate, authorize, controller.getOne.bind(controller));

    // create
    app.route("/api/resources").post(authenticate, authorize, controller.create.bind(controller));

    // update (PUT / PATCH)
    app
      .route("/api/resources/:id")
      .put(authenticate, authorize, controller.update.bind(controller))
      .patch(authenticate, authorize, controller.patch.bind(controller));

    // delete (físico)
    app.route("/api/resources/:id").delete(authenticate, authorize, controller.delete.bind(controller));

    // deactivate (lógico)
    app.route("/api/resources/:id/deactivate").patch(authenticate, authorize, controller.deactivate.bind(controller));
  }
}
