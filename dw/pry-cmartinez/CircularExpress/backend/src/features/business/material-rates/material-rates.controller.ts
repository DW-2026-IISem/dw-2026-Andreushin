import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import { MaterialRatesService } from "./material-rates.service";

// HTTP layer only: reads the request, delegates to the service and picks the status code.
export class MaterialRatesController extends BaseController {
  constructor(private readonly service: MaterialRatesService = new MaterialRatesService()) {
    super();
  }

  // Response also reports how many previous active rates of the material were closed.
  async create(req: Request, res: Response): Promise<void> {
    await this.handle(res, () => this.service.create(req.body), 201);
  }

  // Optional filter: GET /api/material-rates?materialId=3 (current rate of that material)
  async getAll(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ materialRates: await this.service.findAll(req.query.materialId) }));
  }

  async getOne(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ materialRate: await this.service.findOne(this.parseId(req)) }));
  }

  async updatePut(req: Request, res: Response): Promise<void> {
    await this.handle(res, () => this.service.replace(this.parseId(req), req.body));
  }

  async updatePatch(req: Request, res: Response): Promise<void> {
    await this.handle(res, () => this.service.patch(this.parseId(req), req.body));
  }

  async deletePhysical(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => {
      const id = this.parseId(req);
      await this.service.remove(id);
      return { message: "Tarifa eliminada", id };
    });
  }

  async deleteLogical(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({
      message: "Tarifa desactivada",
      materialRate: await this.service.deactivate(this.parseId(req)),
    }));
  }
}
