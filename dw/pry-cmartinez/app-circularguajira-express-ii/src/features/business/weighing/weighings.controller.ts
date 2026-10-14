import { Request, Response } from "express";
import { WeighingsService } from "./weighings.service";
import { handleError } from "../../../shared/http/handleError";

export class WeighingsController {
  constructor(private readonly weighingsService = new WeighingsService()) {}

  // ================== READ ==================

  public async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const weighings = await this.weighingsService.getAll();
      return res.status(200).json({ weighings });
    } catch (error) {
      return handleError(res, error);
    }
  }

  public async getOne(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const item = await this.weighingsService.getOne(req.params.id);
      return res.status(200).json(item);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // ================== CREATE ==================

  public async create(req: Request, res: Response): Promise<Response> {
    try {
      const item = await this.weighingsService.create(req.body);
      return res.status(201).json(item);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // ================== UPDATE ==================

  public async update(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const item = await this.weighingsService.update(req.params.id, req.body);
      return res.status(200).json(item);
    } catch (error) {
      return handleError(res, error);
    }
  }

  public async patch(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const item = await this.weighingsService.patch(req.params.id, req.body);
      return res.status(200).json(item);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // ================== DELETE ==================

  public async delete(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      await this.weighingsService.delete(req.params.id);
      return res.status(200).json({ message: "Pesaje eliminado" });
    } catch (error) {
      return handleError(res, error);
    }
  }

  public async deactivate(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const item = await this.weighingsService.deactivate(req.params.id);
      return res.status(200).json(item);
    } catch (error) {
      return handleError(res, error);
    }
  }
}
