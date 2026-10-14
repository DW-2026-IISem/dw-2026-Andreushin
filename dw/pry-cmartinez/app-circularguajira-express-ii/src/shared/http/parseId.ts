import { BadRequestError } from "../errors/httpError";

// Route ids must be positive integers; anything else is a client error, not a 404.
export const parseId = (value: string): number => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new BadRequestError("El id debe ser un entero positivo");
  }
  return id;
};
