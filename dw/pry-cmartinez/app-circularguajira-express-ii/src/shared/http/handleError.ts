import { Response } from "express";
import { ForeignKeyConstraintError, UniqueConstraintError, ValidationError } from "sequelize";
import { HttpError } from "../errors/httpError";

// Single error -> HTTP mapping of the project, shared by controllers and (from ISS-13) the
// access middlewares: HttpError -> its status (400/401/403/404/409); anything unexpected is
// a 500 without internals.
export const handleError = (res: Response, error: unknown): Response => {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ message: error.message });
  }
  // Safety net for integrity rules enforced by the database (FK RESTRICT, unique indexes).
  if (error instanceof ForeignKeyConstraintError) {
    return res.status(409).json({
      message: "El registro tiene datos relacionados; desactívalo en lugar de eliminarlo",
    });
  }
  if (error instanceof UniqueConstraintError) {
    return res.status(409).json({ message: "Ya existe un registro con esos datos únicos" });
  }
  // Model-level validations (e.g. auth model rules) are client errors.
  if (error instanceof ValidationError) {
    return res.status(400).json({ message: error.errors.map((e) => e.message).join("; ") || error.message });
  }
  console.error(error);
  return res.status(500).json({ message: "Error interno del servidor" });
};
