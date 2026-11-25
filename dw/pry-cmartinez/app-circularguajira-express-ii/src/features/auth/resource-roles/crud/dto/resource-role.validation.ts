import { asBody, positiveInt } from "../../../../../shared/http/validation";
import { BadRequestError } from "../../../../../shared/errors/httpError";
import { ResourceRoleCreateDto, ResourceRoleFilters, ResourceRoleReconcileDto } from "./resource-role.dto";

const MAX_ID = 2_147_483_647;
// Upper bound of one matrix: far above the catalog size, low enough to reject abuse.
const MAX_RESOURCE_IDS = 1000;

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

// The shape is checked here; that the role and the resources exist and are active is the service's job.
export const parseResourceRoleReconcile = (raw: unknown): ResourceRoleReconcileDto => {
  const body = asBody(raw);
  const roleId = positiveInt(body.roleId, "roleId", MAX_ID);
  if (!Array.isArray(body.resourceIds)) {
    throw new BadRequestError("El campo resourceIds debe ser un arreglo de enteros positivos");
  }
  if (body.resourceIds.length > MAX_RESOURCE_IDS) {
    throw new BadRequestError(`El campo resourceIds admite máximo ${MAX_RESOURCE_IDS} elementos`);
  }
  const resourceIds = body.resourceIds.map((value: unknown, index: number) =>
    positiveInt(value, `resourceIds[${index}]`, MAX_ID)
  );
  if (new Set(resourceIds).size !== resourceIds.length) {
    throw new BadRequestError("El campo resourceIds no admite ids repetidos");
  }
  return { roleId, resourceIds };
};
