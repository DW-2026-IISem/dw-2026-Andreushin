import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import { WeighingsService } from "./weighings.service";

// HTTP layer only: reads the request, delegates to the service and picks the status code.
export class WeighingsController extends BaseController {
  constructor(private readonly service: WeighingsService = new WeighingsService()) {
    super();
  }

  async create(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ weighing: await this.service.create(req.body) }), 201);
  }

  // Optional filters: GET /api/weighings?collectionId=1&materialId=2&materialLotId=3
  async getAll(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({
      weighings: await this.service.findAll({
        collectionId: req.query.collectionId,
        materialId: req.query.materialId,
        materialLotId: req.query.materialLotId,
      }),
    }));
  }

  async getOne(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ weighing: await this.service.findOne(this.parseId(req)) }));
  }

  async updatePut(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ weighing: await this.service.replace(this.parseId(req), req.body) }));
  }

  async updatePatch(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ weighing: await this.service.patch(this.parseId(req), req.body) }));
  }

  async deletePhysical(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => {
      const id = this.parseId(req);
      await this.service.remove(id);
      return { message: "Pesaje eliminado; se descontó su peso neto del lote", id };
    });
  }

  async deleteLogical(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({
      message: "Pesaje anulado; se descontó su peso neto del lote",
      weighing: await this.service.deactivate(this.parseId(req)),
    }));
  }
}
