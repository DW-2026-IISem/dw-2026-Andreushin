import { Request, Response } from "express";
import { SessionService } from "./session.service";
import { requireAuthUser } from "../../../shared/auth/auth-user";
import { handleError } from "../../../shared/http/handleError";

// Device of the session for auditing (User-Agent, at most the column size).
const deviceInfo = (req: Request): string | null => req.headers["user-agent"]?.slice(0, 500) ?? null;

// login/refresh/logout are OPEN (the credential travels in the body); profile and
// permissions are JWT (`authenticate` resolved `req.auth`).
export class SessionController {
  constructor(private readonly sessionService = new SessionService()) {}

  // ================== OPEN ==================

  public async login(req: Request, res: Response): Promise<Response> {
    try {
      return res.status(200).json(await this.sessionService.login(req.body, deviceInfo(req)));
    } catch (error) {
      return handleError(res, error);
    }
  }

  public async refresh(req: Request, res: Response): Promise<Response> {
    try {
      return res.status(200).json(await this.sessionService.refresh(req.body, deviceInfo(req)));
    } catch (error) {
      return handleError(res, error);
    }
  }

  public async logout(req: Request, res: Response): Promise<Response> {
    try {
      await this.sessionService.logout(req.body);
      return res.status(200).json({ message: "Sesión cerrada" });
    } catch (error) {
      return handleError(res, error);
    }
  }

  // ================== JWT ==================

  public async profile(req: Request, res: Response): Promise<Response> {
    try {
      return res.status(200).json(await this.sessionService.profile(requireAuthUser(req).id));
    } catch (error) {
      return handleError(res, error);
    }
  }

  public async permissions(req: Request, res: Response): Promise<Response> {
    try {
      const permissions = await this.sessionService.myPermissions(requireAuthUser(req).id);
      return res.status(200).json({ permissions });
    } catch (error) {
      return handleError(res, error);
    }
  }
}
