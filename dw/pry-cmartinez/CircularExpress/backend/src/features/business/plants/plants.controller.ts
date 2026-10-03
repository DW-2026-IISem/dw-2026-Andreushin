import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import { PlantsService } from "./plants.service";

// HTTP layer only: reads the request, delegates to the service and picks the status code.
export class PlantsController extends BaseController {
  constructor(private readonly service: PlantsService = new PlantsService()) {
    super();
  }

  async create(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ plant: await this.service.create(req.body) }), 201);
  }

  // Optional filter: GET /api/plants?municipality=Riohacha
  async getAll(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ plants: await this.service.findAll(req.query.municipality) }));
  }

  async getOne(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ plant: await this.service.findOne(this.parseId(req)) }));
  }

  async updatePut(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ plant: await this.service.replace(this.parseId(req), req.body) }));
  }

  async updatePatch(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ plant: await this.service.patch(this.parseId(req), req.body) }));
  }

  async deletePhysical(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => {
      const id = this.parseId(req);
      await this.service.remove(id);
      return { message: "Planta eliminada", id };
    });
  }

  async deleteLogical(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({
      message: "Planta desactivada",
      plant: await this.service.deactivate(this.parseId(req)),
    }));
  }
}
