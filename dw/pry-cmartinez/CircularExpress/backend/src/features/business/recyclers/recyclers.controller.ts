import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import { RecyclersService } from "./recyclers.service";

// HTTP layer only: reads the request, delegates to the service and picks the status code.
export class RecyclersController extends BaseController {
  constructor(private readonly service: RecyclersService = new RecyclersService()) {
    super();
  }

  async create(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ recycler: await this.service.create(req.body) }), 201);
  }

  async getAll(_req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ recyclers: await this.service.findAll() }));
  }

  async getOne(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ recycler: await this.service.findOne(this.parseId(req)) }));
  }

  async updatePut(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ recycler: await this.service.replace(this.parseId(req), req.body) }));
  }

  async updatePatch(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({ recycler: await this.service.patch(this.parseId(req), req.body) }));
  }

  async deletePhysical(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => {
      const id = this.parseId(req);
      await this.service.remove(id);
      return { message: "Reciclador eliminado", id };
    });
  }

  async deleteLogical(req: Request, res: Response): Promise<void> {
    await this.handle(res, async () => ({
      message: "Reciclador desactivado",
      recycler: await this.service.deactivate(this.parseId(req)),
    }));
  }
}
