import { Application } from "express";
import { RecyclersController } from "./recyclers.controller";

export class RecyclersRoutes {
  public recyclersController: RecyclersController = new RecyclersController();

  public routes(app: Application): void {
    // ================== RUTAS SIN AUTENTICACIÓN / SIN MIDDLEWARE JWT ==================

    // getAll
    app
      .route("/api/recyclers")
      .get(this.recyclersController.getAll.bind(this.recyclersController));

    // getOne
    app
      .route("/api/recyclers/:id")
      .get(this.recyclersController.getOne.bind(this.recyclersController));

    // create
    app
      .route("/api/recyclers")
      .post(this.recyclersController.create.bind(this.recyclersController));
  }
}
