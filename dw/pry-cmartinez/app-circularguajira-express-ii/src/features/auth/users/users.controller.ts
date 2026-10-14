import { Request, Response } from "express";
import { UsersService } from "./users.service";
import { handleError } from "../../../shared/http/handleError";

// HTTP only. Responses are User instances whose toJSON() never includes the password.
export class UsersController {
  constructor(private readonly usersService = new UsersService()) {}

  // ================== READ ==================

  public async getAll(_req: Request, res: Response): Promise<Response> {
    try {
      const users = await this.usersService.getAll();
      return res.status(200).json({ users });
    } catch (error) {
      return handleError(res, error);
    }
  }

  public async getOne(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const user = await this.usersService.getOne(req.params.id);
      return res.status(200).json(user);
    } catch (error) {
      return handleError(res, error);
    }
  }

  public async getEffectivePermissions(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const permissions = await this.usersService.getEffectivePermissions(req.params.id);
      return res.status(200).json({ permissions });
    } catch (error) {
      return handleError(res, error);
    }
  }

  // ================== CREATE ==================

  public async create(req: Request, res: Response): Promise<Response> {
    try {
      const user = await this.usersService.create(req.body);
      return res.status(201).json(user);
    } catch (error) {
      return handleError(res, error);
    }
  }

  // ================== UPDATE ==================

  public async update(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const user = await this.usersService.update(req.params.id, req.body);
      return res.status(200).json(user);
    } catch (error) {
      return handleError(res, error);
    }
  }

  public async patch(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const user = await this.usersService.patch(req.params.id, req.body);
      return res.status(200).json(user);
    } catch (error) {
      return handleError(res, error);
    }
  }

  public async changePassword(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      await this.usersService.changePassword(req.params.id, req.body);
      return res.status(200).json({ message: "Contraseña actualizada" });
    } catch (error) {
      return handleError(res, error);
    }
  }

  // ================== DELETE ==================

  public async delete(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      await this.usersService.delete(req.params.id);
      return res.status(200).json({ message: "Usuario eliminado" });
    } catch (error) {
      return handleError(res, error);
    }
  }

  public async deactivate(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const user = await this.usersService.deactivate(req.params.id);
      return res.status(200).json(user);
    } catch (error) {
      return handleError(res, error);
    }
  }
}
