import { Request, Response } from "express";
import { MaterialRatesService } from "./material-rates.service";
import { handleError } from "../../../shared/http/handleError";

export class MaterialRatesController {
  constructor(private readonly materialRatesService = new MaterialRatesService()) {}

  // ================== READ ==================

  public async getHistory(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const rates = await this.materialRatesService.getHistory(req.params.id);
      return res.status(200).json({ rates });
    } catch (error) {
      return handleError(res, error);
    }
  }

  public async getApplicable(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const rate = await this.materialRatesService.getApplicable(req.params.id, req.query.date);
      return res.status(200).json(rate);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // ================== CREATE ==================

  public async create(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const rate = await this.materialRatesService.create(req.params.id, req.body);
      return res.status(201).json(rate);
    } catch (error) {
      return handleError(res, error);
    }
  }
}
