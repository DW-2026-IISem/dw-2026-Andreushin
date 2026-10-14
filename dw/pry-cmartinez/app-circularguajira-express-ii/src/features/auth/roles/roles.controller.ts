import { Request, Response } from "express";
import { RolesService } from "./roles.service";
import { handleError } from "../../../shared/http/handleError";

export class RolesController {
  constructor(private readonly rolesService = new RolesService()) {}

  // ================== READ ==================

  public async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const roles = await this.rolesService.getAll();
      return res.status(200).json({ roles });
    } catch (error) {
      return handleError(res, error);
    }
  }

  public async getOne(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const item = await this.rolesService.getOne(req.params.id);
      return res.status(200).json(item);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // ================== CREATE ==================

  public async create(req: Request, res: Response): Promise<Response> {
    try {
      const item = await this.rolesService.create(req.body);
      return res.status(201).json(item);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // ================== UPDATE ==================

  public async update(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const item = await this.rolesService.update(req.params.id, req.body);
      return res.status(200).json(item);
    } catch (error) {
      return handleError(res, error);
    }
  }

  public async patch(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const item = await this.rolesService.patch(req.params.id, req.body);
      return res.status(200).json(item);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // ================== DELETE ==================

  public async delete(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      await this.rolesService.delete(req.params.id);
      return res.status(200).json({ message: "Rol eliminado" });
    } catch (error) {
      return handleError(res, error);
    }
  }

  public async deactivate(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const item = await this.rolesService.deactivate(req.params.id);
      return res.status(200).json(item);
    } catch (error) {
      return handleError(res, error);
    }
  }
}
