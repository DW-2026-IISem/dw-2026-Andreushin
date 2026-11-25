import { BadRequestError } from "../../../../../../shared/errors/httpError";
import {
  asBody,
  oneOf,
  optionalText,
  requiredText,
} from "../../../../../../shared/http/validation";
import { MaterialStatus } from "../material.model";
import {
  MaterialCreateDto,
  MaterialPatchDto,
  MaterialUpdateDto,
} from "./material.dto";

const MATERIAL_STATUSES: readonly MaterialStatus[] = ["active", "inactive"];

export const parseMaterialCreate = (raw: unknown): MaterialCreateDto => {
  const body = asBody(raw);
  const input: MaterialCreateDto = {
    name: requiredText(body.name, "name", 60),
    description: optionalText(body.description, "description", 255),
  };
  if (body.status !== undefined) {
    input.status = oneOf(body.status, "status", MATERIAL_STATUSES);
  }
  return input;
};

export const parseMaterialUpdate = (raw: unknown): MaterialUpdateDto => {
  const body = asBody(raw);
  return {
    name: requiredText(body.name, "name", 60),
    description: optionalText(body.description, "description", 255),
  };
};

export const parseMaterialPatch = (raw: unknown): MaterialPatchDto => {
  const body = asBody(raw);
  const patch: MaterialPatchDto = {};
  if (body.name !== undefined) patch.name = requiredText(body.name, "name", 60);
  if (body.description !== undefined) {
    patch.description = optionalText(body.description, "description", 255);
  }
  if (Object.keys(patch).length === 0) {
    throw new BadRequestError("Envía al menos un campo para actualizar (name, description)");
  }
  return patch;
};
