import { BadRequestError } from "../../../../shared/errors/httpError";
import { asBody, Body, oneOf, optionalText, requiredText } from "../../../../shared/http/validation";
import { normalizePath } from "../../../../shared/auth/resource-match";
import { ResourceStatus } from "../resource.model";
import { HttpMethod, ResourceCreateDto, ResourcePatchDto, ResourceUpdateDto } from "./resource.dto";

const STATUSES: readonly ResourceStatus[] = ["active", "inactive"];
const METHODS: readonly HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];
// An API path pattern: /api/<segment>(/<segment>|/:<param>)*, lowercase kebab segments.
const PATH_PATTERN = /^\/api(\/([a-z0-9-]+|:[A-Za-z]+))+$/;

const method = (value: unknown): HttpMethod =>
  oneOf(typeof value === "string" ? value.trim().toUpperCase() : value, "method", METHODS);

const path = (value: unknown): string => {
  const normalized = normalizePath(requiredText(value, "path", 255));
  if (!PATH_PATTERN.test(normalized)) {
    throw new BadRequestError("El campo path debe ser un patrón de la API, p. ej. /api/collections/:id");
  }
  return normalized;
};

const fields = (body: Body): ResourceUpdateDto => ({
  method: method(body.method),
  path: path(body.path),
  description: optionalText(body.description, "description", 255),
});

export const parseResourceCreate = (raw: unknown): ResourceCreateDto => {
  const body = asBody(raw);
  const input: ResourceCreateDto = fields(body);
  if (body.status !== undefined) input.status = oneOf(body.status, "status", STATUSES);
  return input;
};

export const parseResourceUpdate = (raw: unknown): ResourceUpdateDto => fields(asBody(raw));

export const parseResourcePatch = (raw: unknown): ResourcePatchDto => {
  const body = asBody(raw);
  const patch: ResourcePatchDto = {};
  if (body.method !== undefined) patch.method = method(body.method);
  if (body.path !== undefined) patch.path = path(body.path);
  if (body.description !== undefined) patch.description = optionalText(body.description, "description", 255);
  if (Object.keys(patch).length === 0) {
    throw new BadRequestError("Envía al menos un campo para actualizar (method, path, description)");
  }
  return patch;
};
