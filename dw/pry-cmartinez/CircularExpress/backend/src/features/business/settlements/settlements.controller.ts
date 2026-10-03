import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import { SettlementsService } from "./settlements.service";

// HTTP layer only: reads the request, delegates to the service and picks the status code.
export class SettlementsController extends BaseController {
  constructor(private readonly service: SettlementsService = new SettlementsService()) {
    super();
  }

  // Response includes the per-material breakdown used to compute the amount.
  async create(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ settlement: await this.service.create(req.body) }), 201);
  }

  // Optional filters: GET /api/settlements?recyclerId=2&state=pending
  async getAll(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({
      settlements: await this.service.findAll({ recyclerId: req.query.recyclerId, state: req.query.state }),
    }));
  }

  async getOne(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ settlement: await this.service.findOne(this.parseId(req)) }));
  }

  async updatePut(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ settlement: await this.service.replace(this.parseId(req), req.body) }));
  }

  // Also used for state transitions: PATCH { "state": "approved" }
  async updatePatch(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ settlement: await this.service.patch(this.parseId(req), req.body) }));
  }

  async deletePhysical(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => {
      const id = this.parseId(req);
      await this.service.remove(id);
      return { message: "Liquidación eliminada", id };
    });
  }

  async deleteLogical(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({
      message: "Liquidación anulada",
      settlement: await this.service.deactivate(this.parseId(req)),
    }));
  }
}
