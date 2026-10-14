import { Request, Response } from "express";
import { CollectionPointsService } from "./collection-points.service";
import { handleError } from "../../../shared/http/handleError";

export class CollectionPointsController {
  constructor(private readonly collectionPointsService = new CollectionPointsService()) {}

  // ================== READ ==================

  public async getAll(_req: Request, res: Response): Promise<Response> {
    try {
      const points = await this.collectionPointsService.getAll();
      return res.status(200).json({ points });
    } catch (error) {
      return handleError(res, error);
    }
  }

  public async getOne(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const item = await this.collectionPointsService.getOne(req.params.id);
      return res.status(200).json(item);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // Stops of a route in visit order (GET /api/routes/:id/points).
  public async getByRoute(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const points = await this.collectionPointsService.getByRoute(req.params.id);
      return res.status(200).json({ points });
    } catch (error) {
      return handleError(res, error);
    }
  }

  // ================== CREATE ==================

  public async create(req: Request, res: Response): Promise<Response> {
    try {
      const item = await this.collectionPointsService.create(req.body);
      return res.status(201).json(item);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // ================== UPDATE ==================

  public async update(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const item = await this.collectionPointsService.update(req.params.id, req.body);
      return res.status(200).json(item);
    } catch (error) {
      return handleError(res, error);
    }
  }

  public async patch(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const item = await this.collectionPointsService.patch(req.params.id, req.body);
      return res.status(200).json(item);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // ================== DELETE ==================

  public async delete(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      await this.collectionPointsService.delete(req.params.id);
      return res.status(200).json({ message: "Punto de recolección eliminado" });
    } catch (error) {
      return handleError(res, error);
    }
  }

  public async deactivate(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const item = await this.collectionPointsService.deactivate(req.params.id);
      return res.status(200).json(item);
    } catch (error) {
      return handleError(res, error);
    }
  }
}
