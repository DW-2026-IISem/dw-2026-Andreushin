import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import { MaterialsService } from "./materials.service";

// HTTP layer only: reads the request, delegates to the service and picks the status code.
export class MaterialsController extends BaseController {
  constructor(private readonly service: MaterialsService = new MaterialsService()) {
    super();
  }

  async create(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ material: await this.service.create(req.body) }), 201);
  }

  async getAll(_req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ materials: await this.service.findAll() }));
  }

  async getOne(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ material: await this.service.findOne(this.parseId(req)) }));
  }

  async updatePut(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ material: await this.service.replace(this.parseId(req), req.body) }));
  }

  async updatePatch(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ material: await this.service.patch(this.parseId(req), req.body) }));
  }

  async deletePhysical(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => {
      const id = this.parseId(req);
      await this.service.remove(id);
      return { message: "Material eliminado", id };
    });
  }

  async deleteLogical(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({
      message: "Material desactivado",
      material: await this.service.deactivate(this.parseId(req)),
    }));
  }
}
