import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import { RoutesService } from "./routes.service";

// HTTP layer only: reads the request, delegates to the service and picks the status code.
export class RoutesController extends BaseController {
  constructor(private readonly service: RoutesService = new RoutesService()) {
    super();
  }

  async create(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ route: await this.service.create(req.body) }), 201);
  }

  async getAll(_req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ routes: await this.service.findAll() }));
  }

  async getOne(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ route: await this.service.findOne(this.parseId(req)) }));
  }

  async updatePut(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ route: await this.service.replace(this.parseId(req), req.body) }));
  }

  async updatePatch(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ route: await this.service.patch(this.parseId(req), req.body) }));
  }

  async deletePhysical(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => {
      const id = this.parseId(req);
      await this.service.remove(id);
      return { message: "Ruta eliminada", id };
    });
  }

  async deleteLogical(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({
      message: "Ruta desactivada",
      route: await this.service.deactivate(this.parseId(req)),
    }));
  }
}
