import { Request, Response } from "express";
import { AppError, ValidationError } from "../errors/app-error";

export abstract class BaseController {
  // Runs the action and sends its result; AppError becomes its status code, anything else a 500.
  protected async handle(res: Response, action: () => Promise<unknown>, successStatus = 200): Promise<void> {
    try {
      const body = await action();
      res.status(successStatus).json(body);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  protected parseId(req: Request, param = "id"): number {
    const raw = req.params[param];
    const value = Number(Array.isArray(raw) ? raw[0] : raw);
    if (!Number.isInteger(value) || value <= 0) {
      throw new ValidationError("El id debe ser un número entero positivo");
    }
    return value;
  }

  private handleError(res: Response, error: unknown): void {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        error: error.message,
        ...(error.details !== undefined && { details: error.details }),
      });
      return;
    }
    console.error("Unexpected error:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}
