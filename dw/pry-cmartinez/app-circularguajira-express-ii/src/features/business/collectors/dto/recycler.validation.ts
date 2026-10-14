import { BadRequestError } from "../../../../shared/errors/httpError";
import { RecyclerStatus, RecyclerType } from "../recycler.model";
import { RecyclerInputDto } from "./recycler.dto";

const RECYCLER_TYPES: readonly RecyclerType[] = ["independent", "organization"];
const RECYCLER_STATUSES: readonly RecyclerStatus[] = ["active", "inactive"];
// Citizen ID (digits) or NIT with optional check digit, e.g. 900123456-1.
const DOCUMENT_PATTERN = /^\d{5,15}(-\d)?$/;
const PHONE_PATTERN = /^\+?\d{7,15}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Body = Record<string, unknown>;

const asBody = (raw: unknown): Body => {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new BadRequestError("El cuerpo de la petición debe ser un objeto JSON");
  }
  return raw as Body;
};

const requiredText = (value: unknown, field: string, max: number, pattern?: RegExp): string => {
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

const optionalText = (
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

const oneOf = <T extends string>(value: unknown, field: string, options: readonly T[]): T => {
  if (typeof value !== "string" || !options.includes(value as T)) {
    throw new BadRequestError(`El campo ${field} debe ser uno de: ${options.join(", ")}`);
  }
  return value as T;
};

// Full payload (POST / PUT): every required field must be present and valid.
export const parseRecyclerInput = (raw: unknown): RecyclerInputDto => {
  const body = asBody(raw);
  const input: RecyclerInputDto = {
    name: requiredText(body.name, "name", 120),
    documentNumber: requiredText(body.documentNumber, "documentNumber", 20, DOCUMENT_PATTERN),
    recyclerType: oneOf(body.recyclerType, "recyclerType", RECYCLER_TYPES),
    phone: requiredText(body.phone, "phone", 20, PHONE_PATTERN),
    email: optionalText(body.email, "email", 120, EMAIL_PATTERN),
    address: optionalText(body.address, "address", 200),
  };
  if (body.status !== undefined) {
    input.status = oneOf(body.status, "status", RECYCLER_STATUSES);
  }
  return input;
};
