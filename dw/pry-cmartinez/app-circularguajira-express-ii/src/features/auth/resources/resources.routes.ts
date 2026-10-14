import { Application } from "express";
import { ResourcesController } from "./resources.controller";
import { authenticate } from "../access/authenticate";

/**
 * Resources endpoints. Access mode now: JWT (`authenticate`); ISS-13 chains `authorize`
 * (JWT + RBAC) after it.
 */
export class ResourcesRoutes {
  public resourcesController: ResourcesController = new ResourcesController();

  public routes(app: Application): void {
    const controller = this.resourcesController;

    // getAll
    app.route("/api/resources").get(authenticate, controller.getAll.bind(controller));

    // getOne
    app.route("/api/resources/:id").get(authenticate, controller.getOne.bind(controller));

    // create
    app.route("/api/resources").post(authenticate, controller.create.bind(controller));

    // update (PUT / PATCH)
    app
      .route("/api/resources/:id")
      .put(authenticate, controller.update.bind(controller))
      .patch(authenticate, controller.patch.bind(controller));

    // delete (físico)
    app.route("/api/resources/:id").delete(authenticate, controller.delete.bind(controller));

    // deactivate (lógico)
    app.route("/api/resources/:id/deactivate").patch(authenticate, controller.deactivate.bind(controller));
  }
}
