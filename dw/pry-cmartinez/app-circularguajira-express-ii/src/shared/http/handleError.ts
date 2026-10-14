import { Response } from "express";
import { ForeignKeyConstraintError, UniqueConstraintError } from "sequelize";
import { HttpError } from "../errors/httpError";

// Maps domain errors to their HTTP status; anything unexpected is a 500 without internals.
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
  console.error(error);
  return res.status(500).json({ message: "Error interno del servidor" });
};
