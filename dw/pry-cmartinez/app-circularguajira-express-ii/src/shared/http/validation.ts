import { BadRequestError } from "../errors/httpError";

// Field validators shared by the feature payload parsers (dto/*.validation.ts).

export type Body = Record<string, unknown>;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const asBody = (raw: unknown): Body => {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new BadRequestError("El cuerpo de la petición debe ser un objeto JSON");
  }
  return raw as Body;
};

export const requiredText = (
  value: unknown,
  field: string,
  max: number,
  pattern?: RegExp
): string => {
  if (typeof value !== "string" || value.trim() === "") {
    throw new BadRequestError(`El campo ${field} es obligatorio`);
  }
  const text = value.trim();
  if (text.length > max) {
    throw new BadRequestError(`El campo ${field} admite máximo ${max} caracteres`);
  }
  if (pattern && !pattern.test(text)) {
    throw new BadRequestError(`El campo ${field} tiene un formato inválido`);
  }
  return text;
};

export const optionalText = (
  value: unknown,
  field: string,
  max: number,
  pattern?: RegExp
): string | null => {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  return requiredText(value, field, max, pattern);
};

export const oneOf = <T extends string>(value: unknown, field: string, options: readonly T[]): T => {
  if (typeof value !== "string" || !options.includes(value as T)) {
    throw new BadRequestError(`El campo ${field} debe ser uno de: ${options.join(", ")}`);
  }
  return value as T;
};

// Calendar date as YYYY-MM-DD (rejects impossible dates such as 2026-02-30).
export const requiredDate = (value: unknown, field: string): string => {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) {
    throw new BadRequestError(`El campo ${field} debe ser una fecha YYYY-MM-DD`);
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new BadRequestError(`El campo ${field} no es una fecha válida`);
  }
  return value;
};

// Positive money amount with at most two decimals.
export const positiveAmount = (value: unknown, field: string, max: number): number => {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0 || value > max) {
    throw new BadRequestError(`El campo ${field} debe ser un número mayor que 0 y hasta ${max}`);
  }
  if (Math.abs(value * 100 - Math.round(value * 100)) > 1e-9) {
    throw new BadRequestError(`El campo ${field} admite máximo 2 decimales`);
  }
  return value;
};
