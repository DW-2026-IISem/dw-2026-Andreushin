import { ValidationError } from "../errors/app-error";

// Parses an optional text filter from the query string (?municipality=Riohacha); undefined when absent.
export function parseTextFilter(value: unknown, field: string, maxLength = 100): string | undefined {
  if (value === undefined) return undefined;
  const text = String(Array.isArray(value) ? value[0] : value).trim();
  if (text === "" || text.length > maxLength) {
    throw new ValidationError(`${field} debe ser un texto no vacío de máximo ${maxLength} caracteres`);
  }
  return text;
}

// Parses an optional numeric id from the query string (?routeId=3); undefined when absent.
export function parseIdFilter(value: unknown, field: string): number | undefined {
  if (value === undefined) return undefined;
  const id = Number(Array.isArray(value) ? value[0] : value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError(`${field} debe ser un número entero positivo`);
  }
  return id;
}
