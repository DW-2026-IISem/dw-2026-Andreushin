import { BadRequestError } from "../../../../shared/errors/httpError";
import { asBody, oneOf, optionalText, requiredText } from "../../../../shared/http/validation";
import { RecyclerStatus, RecyclerType } from "../recycler.model";
import { RecyclerInputDto, RecyclerPatchDto } from "./recycler.dto";

const RECYCLER_TYPES: readonly RecyclerType[] = ["independent", "organization"];
const RECYCLER_STATUSES: readonly RecyclerStatus[] = ["active", "inactive"];
// Citizen ID (digits) or NIT with optional check digit, e.g. 900123456-1.
const DOCUMENT_PATTERN = /^\d{5,15}(-\d)?$/;
const PHONE_PATTERN = /^\+?\d{7,15}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

// Partial payload (PATCH): only the fields present are validated; at least one is required.
export const parseRecyclerPatch = (raw: unknown): RecyclerPatchDto => {
  const body = asBody(raw);
  const patch: RecyclerPatchDto = {};
  if (body.name !== undefined) patch.name = requiredText(body.name, "name", 120);
  if (body.documentNumber !== undefined) {
    patch.documentNumber = requiredText(body.documentNumber, "documentNumber", 20, DOCUMENT_PATTERN);
  }
  if (body.recyclerType !== undefined) {
    patch.recyclerType = oneOf(body.recyclerType, "recyclerType", RECYCLER_TYPES);
  }
  if (body.phone !== undefined) patch.phone = requiredText(body.phone, "phone", 20, PHONE_PATTERN);
  if (body.email !== undefined) patch.email = optionalText(body.email, "email", 120, EMAIL_PATTERN);
  if (body.address !== undefined) patch.address = optionalText(body.address, "address", 200);
  if (body.status !== undefined) patch.status = oneOf(body.status, "status", RECYCLER_STATUSES);
  if (Object.keys(patch).length === 0) {
    throw new BadRequestError("Envía al menos un campo para actualizar");
  }
  return patch;
};
