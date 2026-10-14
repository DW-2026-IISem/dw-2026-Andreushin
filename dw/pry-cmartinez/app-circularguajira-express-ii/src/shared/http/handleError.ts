import { Response } from "express";
import { HttpError } from "../errors/httpError";

// Maps domain errors to their HTTP status; anything unexpected is a 500 without internals.
export const handleError = (res: Response, error: unknown): Response => {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ message: error.message });
  }
  console.error(error);
  return res.status(500).json({ message: "Error interno del servidor" });
};
