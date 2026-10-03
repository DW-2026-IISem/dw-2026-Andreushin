import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import { CollectionPointsService } from "./collection-points.service";

// HTTP layer only: reads the request, delegates to the service and picks the status code.
export class CollectionPointsController extends BaseController {
  constructor(private readonly service: CollectionPointsService = new CollectionPointsService()) {
    super();
  }

  async create(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ collectionPoint: await this.service.create(req.body) }), 201);
  }

  // Optional filter: GET /api/collection-points?routeId=3
  async getAll(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ collectionPoints: await this.service.findAll(req.query.routeId) }));
  }

  async getOne(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ collectionPoint: await this.service.findOne(this.parseId(req)) }));
  }

  async updatePut(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({
      collectionPoint: await this.service.replace(this.parseId(req), req.body),
    }));
  }

  async updatePatch(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({
      collectionPoint: await this.service.patch(this.parseId(req), req.body),
    }));
  }

  async deletePhysical(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => {
      const id = this.parseId(req);
      await this.service.remove(id);
      return { message: "Punto de acopio eliminado", id };
    });
  }

  async deleteLogical(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({
      message: "Punto de acopio desactivado",
      collectionPoint: await this.service.deactivate(this.parseId(req)),
    }));
  }
}
