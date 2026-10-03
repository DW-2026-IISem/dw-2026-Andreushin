import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import { CollectionsService } from "./collections.service";

// HTTP layer only: reads the request, delegates to the service and picks the status code.
export class CollectionsController extends BaseController {
  constructor(private readonly service: CollectionsService = new CollectionsService()) {
    super();
  }

  async create(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ collection: await this.service.create(req.body) }), 201);
  }

  // Optional filters: GET /api/collections?recyclerId=2&routeId=3
  async getAll(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({
      collections: await this.service.findAll({ recyclerId: req.query.recyclerId, routeId: req.query.routeId }),
    }));
  }

  async getOne(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ collection: await this.service.findOne(this.parseId(req)) }));
  }

  async updatePut(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ collection: await this.service.replace(this.parseId(req), req.body) }));
  }

  async updatePatch(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ collection: await this.service.patch(this.parseId(req), req.body) }));
  }

  async deletePhysical(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => {
      const id = this.parseId(req);
      await this.service.remove(id);
      return { message: "Jornada de recolección eliminada", id };
    });
  }

  async deleteLogical(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({
      message: "Jornada de recolección desactivada",
      collection: await this.service.deactivate(this.parseId(req)),
    }));
  }
}
