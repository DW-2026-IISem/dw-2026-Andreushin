import { BadRequestError } from "../../../../shared/errors/httpError";
import { asBody, Body, oneOf, optionalText, requiredText } from "../../../../shared/http/validation";
import { RoleStatus } from "../role.model";
import { RoleCreateDto, RolePatchDto, RoleUpdateDto } from "./role.dto";

const STATUSES: readonly RoleStatus[] = ["active", "inactive"];
// Functional identifier: letters and underscore, stored in uppercase (e.g. BASCULA).
const NAME_PATTERN = /^[A-Za-z][A-Za-z_]{1,79}$/;

const roleName = (value: unknown): string => requiredText(value, "name", 80, NAME_PATTERN).toUpperCase();

const fields = (body: Body): RoleUpdateDto => ({
  name: roleName(body.name),
  description: optionalText(body.description, "description", 255),
});

export const parseRoleCreate = (raw: unknown): RoleCreateDto => {
  const body = asBody(raw);
  const input: RoleCreateDto = fields(body);
  if (body.status !== undefined) input.status = oneOf(body.status, "status", STATUSES);
  return input;
};

export const parseRoleUpdate = (raw: unknown): RoleUpdateDto => fields(asBody(raw));

export const parseRolePatch = (raw: unknown): RolePatchDto => {
  const body = asBody(raw);
  const patch: RolePatchDto = {};
  if (body.name !== undefined) patch.name = roleName(body.name);
  if (body.description !== undefined) patch.description = optionalText(body.description, "description", 255);
  if (Object.keys(patch).length === 0) {
    throw new BadRequestError("Envía al menos un campo para actualizar (name, description)");
  }
  return patch;
};
