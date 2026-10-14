import { Request, Response } from "express";
import { RoleUsersService } from "./role-users.service";
import { handleError } from "../../../shared/http/handleError";

// No physical delete: revoking is logical and reversible, so the audit trail is kept.
export class RoleUsersController {
  constructor(private readonly roleUsersService = new RoleUsersService()) {}

  // ================== READ ==================

  public async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const assignments = await this.roleUsersService.getAll();
      return res.status(200).json({ assignments });
    } catch (error) {
      return handleError(res, error);
    }
  }

  public async getOne(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const item = await this.roleUsersService.getOne(req.params.id);
      return res.status(200).json(item);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // ================== CREATE ==================

  // 201 when the pair is new, 200 when an inactive one is reactivated.
  public async assign(req: Request, res: Response): Promise<Response> {
    try {
      const { assignment, reactivated } = await this.roleUsersService.assign(req.body);
      return res.status(reactivated ? 200 : 201).json(assignment);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // ================== STATE ==================

  public async deactivate(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const item = await this.roleUsersService.deactivate(req.params.id);
      return res.status(200).json(item);
    } catch (error) {
      return handleError(res, error);
    }
  }

  public async reactivate(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const item = await this.roleUsersService.reactivate(req.params.id);
      return res.status(200).json(item);
    } catch (error) {
      return handleError(res, error);
    }
  }
}
