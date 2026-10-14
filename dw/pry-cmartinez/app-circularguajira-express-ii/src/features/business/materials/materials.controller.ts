import { Request, Response } from "express";
import { MaterialsService } from "./materials.service";
import { handleError } from "../../../shared/http/handleError";

export class MaterialsController {
  constructor(private readonly materialsService = new MaterialsService()) {}

  // ================== READ ==================

  public async getAll(_req: Request, res: Response): Promise<Response> {
    try {
      const materials = await this.materialsService.getAll();
      return res.status(200).json({ materials });
    } catch (error) {
      return handleError(res, error);
    }
  }

  public async getOne(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const material = await this.materialsService.getOne(req.params.id);
      return res.status(200).json(material);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // ================== CREATE ==================

  public async create(req: Request, res: Response): Promise<Response> {
    try {
      const material = await this.materialsService.create(req.body);
      return res.status(201).json(material);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // ================== UPDATE ==================

  public async update(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const material = await this.materialsService.update(req.params.id, req.body);
      return res.status(200).json(material);
    } catch (error) {
      return handleError(res, error);
    }
  }

  public async patch(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const material = await this.materialsService.patch(req.params.id, req.body);
      return res.status(200).json(material);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // ================== DELETE ==================

  public async delete(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      await this.materialsService.delete(req.params.id);
      return res.status(200).json({ message: "Material eliminado" });
    } catch (error) {
      return handleError(res, error);
    }
  }

  public async deactivate(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const material = await this.materialsService.deactivate(req.params.id);
      return res.status(200).json(material);
    } catch (error) {
      return handleError(res, error);
    }
  }
}
