import { Request, Response } from "express";
import { RefreshTokensService } from "./refresh-tokens.service";
import { requireAuthUser } from "../../../shared/auth/auth-user";
import { handleError } from "../../../shared/http/handleError";

// Own sessions of the authenticated user (`req.auth`); never another user's.
export class RefreshTokensController {
  constructor(private readonly refreshTokensService = new RefreshTokensService()) {}

  // ================== READ ==================

  public async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const sessions = await this.refreshTokensService.getAllMine(requireAuthUser(req).id);
      return res.status(200).json({ sessions });
    } catch (error) {
      return handleError(res, error);
    }
  }

  public async getOne(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const session = await this.refreshTokensService.getMine(requireAuthUser(req).id, req.params.id);
      return res.status(200).json(session);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // ================== STATE (revoke) ==================

  public async deactivate(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const session = await this.refreshTokensService.revokeMine(requireAuthUser(req).id, req.params.id);
      return res.status(200).json({ message: "Sesión revocada", session });
    } catch (error) {
      return handleError(res, error);
    }
  }

  public async deactivateAll(req: Request, res: Response): Promise<Response> {
    try {
      const revoked = await this.refreshTokensService.revokeAllMine(requireAuthUser(req).id);
      return res.status(200).json({ message: "Sesiones revocadas", revoked });
    } catch (error) {
      return handleError(res, error);
    }
  }

  // ================== DELETE (purge) ==================

  public async purge(req: Request, res: Response): Promise<Response> {
    try {
      const purged = await this.refreshTokensService.purgeMine(requireAuthUser(req).id);
      return res.status(200).json({ message: "Sesiones revocadas o expiradas eliminadas", purged });
    } catch (error) {
      return handleError(res, error);
    }
  }
}
