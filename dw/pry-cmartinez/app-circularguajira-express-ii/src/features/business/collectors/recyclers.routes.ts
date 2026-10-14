import { Application } from "express";
import { RecyclersController } from "./recyclers.controller";

export class RecyclersRoutes {
  public recyclersController: RecyclersController = new RecyclersController();

  public routes(app: Application): void {
    // ================== RUTAS SIN AUTENTICACIÓN / SIN MIDDLEWARE JWT ==================
  }
}
