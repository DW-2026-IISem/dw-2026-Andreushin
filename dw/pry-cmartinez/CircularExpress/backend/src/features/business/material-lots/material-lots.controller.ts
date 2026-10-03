import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import { MaterialLotsService } from "./material-lots.service";

// HTTP layer only: reads the request, delegates to the service and picks the status code.
export class MaterialLotsController extends BaseController {
  constructor(private readonly service: MaterialLotsService = new MaterialLotsService()) {
    super();
  }

  async create(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ materialLot: await this.service.create(req.body) }), 201);
  }

  // Optional filters: GET /api/material-lots?plantId=1&materialId=3
  async getAll(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({
      materialLots: await this.service.findAll({ plantId: req.query.plantId, materialId: req.query.materialId }),
    }));
  }

  async getOne(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ materialLot: await this.service.findOne(this.parseId(req)) }));
  }

  async updatePut(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ materialLot: await this.service.replace(this.parseId(req), req.body) }));
  }

  async updatePatch(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ materialLot: await this.service.patch(this.parseId(req), req.body) }));
  }

  async deletePhysical(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => {
      const id = this.parseId(req);
      await this.service.remove(id);
      return { message: "Lote eliminado", id };
    });
  }

  async deleteLogical(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({
      message: "Lote desactivado",
      materialLot: await this.service.deactivate(this.parseId(req)),
    }));
  }
}
