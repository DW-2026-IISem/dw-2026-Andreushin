import { Request, Response } from "express";
import { SettlementsService } from "./settlements.service";
import { handleError } from "../../../shared/http/handleError";

export class SettlementsController {
  constructor(private readonly settlementsService = new SettlementsService()) {}

  // ================== READ ==================

  public async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const settlements = await this.settlementsService.getAll();
      return res.status(200).json({ settlements });
    } catch (error) {
      return handleError(res, error);
    }
  }

  public async getOne(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const item = await this.settlementsService.getOne(req.params.id);
      return res.status(200).json(item);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // Recomputes the settlement from its stored references (GET /api/settlements/:id/verify).
  public async verify(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const report = await this.settlementsService.verify(req.params.id);
      return res.status(200).json(report);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // ================== CREATE ==================

  public async create(req: Request, res: Response): Promise<Response> {
    try {
      const item = await this.settlementsService.create(req.body);
      return res.status(201).json(item);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // ================== UPDATE ==================

  public async update(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const item = await this.settlementsService.updateNotes(req.params.id, req.body);
      return res.status(200).json(item);
    } catch (error) {
      return handleError(res, error);
    }
  }

  public async patch(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const item = await this.settlementsService.updateNotes(req.params.id, req.body);
      return res.status(200).json(item);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // ================== DELETE ==================

  public async delete(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      await this.settlementsService.delete(req.params.id);
      return res.status(200).json({ message: "Liquidación eliminada" });
    } catch (error) {
      return handleError(res, error);
    }
  }

  public async void(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const item = await this.settlementsService.void(req.params.id);
      return res.status(200).json(item);
    } catch (error) {
      return handleError(res, error);
    }
  }
}
