import { asBody, positiveInt } from "../../../../shared/http/validation";
import { BadRequestError } from "../../../../shared/errors/httpError";
import { ResourceRoleCreateDto, ResourceRoleFilters } from "./resource-role.dto";

const MAX_ID = 2_147_483_647;

export const parseResourceRoleCreate = (raw: unknown): ResourceRoleCreateDto => {
  const body = asBody(raw);
  return {
    roleId: positiveInt(body.roleId, "roleId", MAX_ID),
    resourceId: positiveInt(body.resourceId, "resourceId", MAX_ID),
  };
};

const queryId = (value: unknown, field: string): number | undefined => {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !/^[1-9]\d{0,9}$/.test(value)) {
    throw new BadRequestError(`El filtro ${field} debe ser un entero positivo`);
  }
  return Number(value);
};

export const parseResourceRoleFilters = (query: Record<string, unknown>): ResourceRoleFilters => ({
  roleId: queryId(query.roleId, "roleId"),
  resourceId: queryId(query.resourceId, "resourceId"),
});
