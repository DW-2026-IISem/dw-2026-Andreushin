import { Request, Response } from "express";
import { ResourceRolesService } from "./resource-roles.service";
import { handleError } from "../../../shared/http/handleError";

// No physical delete: revoking is logical and reversible, so the audit trail is kept.
export class ResourceRolesController {
  constructor(private readonly resourceRolesService = new ResourceRolesService()) {}

  // ================== READ ==================

  public async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const grants = await this.resourceRolesService.getAll(req.query);
      return res.status(200).json({ grants });
    } catch (error) {
      return handleError(res, error);
    }
  }

  public async getOne(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const item = await this.resourceRolesService.getOne(req.params.id);
      return res.status(200).json(item);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // ================== CREATE ==================

  // 201 when the pair is new, 200 when an inactive one is reactivated.
  public async grant(req: Request, res: Response): Promise<Response> {
    try {
      const { grant, reactivated } = await this.resourceRolesService.grant(req.body);
      return res.status(reactivated ? 200 : 201).json(grant);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // ================== STATE ==================

  public async deactivate(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const item = await this.resourceRolesService.deactivate(req.params.id);
      return res.status(200).json(item);
    } catch (error) {
      return handleError(res, error);
    }
  }

  public async reactivate(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const item = await this.resourceRolesService.reactivate(req.params.id);
      return res.status(200).json(item);
    } catch (error) {
      return handleError(res, error);
    }
  }
}
