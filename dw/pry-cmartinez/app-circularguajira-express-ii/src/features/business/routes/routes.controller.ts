import { Request, Response } from "express";
import { RoutesService } from "./routes.service";
import { handleError } from "../../../shared/http/handleError";

export class RoutesController {
  constructor(private readonly routesService = new RoutesService()) {}

  // ================== READ ==================

  public async getAll(_req: Request, res: Response): Promise<Response> {
    try {
      const routes = await this.routesService.getAll();
      return res.status(200).json({ routes });
    } catch (error) {
      return handleError(res, error);
    }
  }

  public async getOne(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const item = await this.routesService.getOne(req.params.id);
      return res.status(200).json(item);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // ================== CREATE ==================

  public async create(req: Request, res: Response): Promise<Response> {
    try {
      const item = await this.routesService.create(req.body);
      return res.status(201).json(item);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // ================== UPDATE ==================

  public async update(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const item = await this.routesService.update(req.params.id, req.body);
      return res.status(200).json(item);
    } catch (error) {
      return handleError(res, error);
    }
  }

  public async patch(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const item = await this.routesService.patch(req.params.id, req.body);
      return res.status(200).json(item);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // ================== DELETE ==================

  public async delete(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      await this.routesService.delete(req.params.id);
      return res.status(200).json({ message: "Ruta eliminada" });
    } catch (error) {
      return handleError(res, error);
    }
  }

  public async deactivate(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const item = await this.routesService.deactivate(req.params.id);
      return res.status(200).json(item);
    } catch (error) {
      return handleError(res, error);
    }
  }
}
