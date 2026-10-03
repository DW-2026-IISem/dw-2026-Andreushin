import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import { MaterialSalesService } from "./material-sales.service";

// HTTP layer only: reads the request, delegates to the service and picks the status code.
export class MaterialSalesController extends BaseController {
  constructor(private readonly service: MaterialSalesService = new MaterialSalesService()) {
    super();
  }

  async create(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ materialSale: await this.service.create(req.body) }), 201);
  }

  // Optional filter: GET /api/material-sales?materialLotId=3
  async getAll(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ materialSales: await this.service.findAll(req.query.materialLotId) }));
  }

  async getOne(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ materialSale: await this.service.findOne(this.parseId(req)) }));
  }

  async updatePut(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ materialSale: await this.service.replace(this.parseId(req), req.body) }));
  }

  async updatePatch(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ materialSale: await this.service.patch(this.parseId(req), req.body) }));
  }

  async deletePhysical(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => {
      const id = this.parseId(req);
      await this.service.remove(id);
      return { message: "Venta eliminada; la cantidad volvió a las existencias del lote", id };
    });
  }

  async deleteLogical(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({
      message: "Venta anulada; la cantidad volvió a las existencias del lote",
      materialSale: await this.service.deactivate(this.parseId(req)),
    }));
  }
}
