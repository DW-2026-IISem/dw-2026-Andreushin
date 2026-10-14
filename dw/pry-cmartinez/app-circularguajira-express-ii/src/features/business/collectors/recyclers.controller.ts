import { Request, Response } from "express";
import { RecyclersService } from "./recyclers.service";
import { handleError } from "../../../shared/http/handleError";

export class RecyclersController {
  constructor(private readonly recyclersService = new RecyclersService()) {}

  // ================== READ ==================

  public async getAll(_req: Request, res: Response): Promise<Response> {
    try {
      const recyclers = await this.recyclersService.getAll();
      return res.status(200).json({ recyclers });
    } catch (error) {
      return handleError(res, error);
    }
  }

  public async getOne(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const recycler = await this.recyclersService.getOne(req.params.id);
      return res.status(200).json(recycler);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // ================== CREATE ==================

  public async create(req: Request, res: Response): Promise<Response> {
    try {
      const recycler = await this.recyclersService.create(req.body);
      return res.status(201).json(recycler);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // ================== UPDATE ==================

  public async update(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const recycler = await this.recyclersService.update(req.params.id, req.body);
      return res.status(200).json(recycler);
    } catch (error) {
      return handleError(res, error);
    }
  }

  public async patch(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const recycler = await this.recyclersService.patch(req.params.id, req.body);
      return res.status(200).json(recycler);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // ================== DELETE ==================

  public async delete(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      await this.recyclersService.delete(req.params.id);
      return res.status(200).json({ message: "Reciclador eliminado" });
    } catch (error) {
      return handleError(res, error);
    }
  }

  public async deactivate(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const recycler = await this.recyclersService.deactivate(req.params.id);
      return res.status(200).json(recycler);
    } catch (error) {
      return handleError(res, error);
    }
  }
}
