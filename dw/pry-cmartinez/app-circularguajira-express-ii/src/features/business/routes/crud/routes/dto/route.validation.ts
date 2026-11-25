import { BadRequestError } from "../../../../../../shared/errors/httpError";
import { asBody, Body, oneOf, optionalText, requiredText } from "../../../../../../shared/http/validation";
import { RouteStatus } from "../route.model";
import {
  RouteCreateDto,
  RoutePatchDto,
  RouteUpdateDto,
} from "./route.dto";

const STATUSES: readonly RouteStatus[] = ["active", "inactive"];

const ensureNotEmpty = (patch: object, fields: string): void => {
  if (Object.keys(patch).length === 0) {
    throw new BadRequestError(`Envía al menos un campo para actualizar (${fields})`);
  }
};

const routeFields = (body: Body): RouteUpdateDto => ({
  name: requiredText(body.name, "name", 80),
  municipality: requiredText(body.municipality, "municipality", 60),
  description: optionalText(body.description, "description", 255),
});

export const parseRouteCreate = (raw: unknown): RouteCreateDto => {
  const body = asBody(raw);
  const input: RouteCreateDto = routeFields(body);
  if (body.status !== undefined) input.status = oneOf(body.status, "status", STATUSES);
  return input;
};

export const parseRouteUpdate = (raw: unknown): RouteUpdateDto => routeFields(asBody(raw));

export const parseRoutePatch = (raw: unknown): RoutePatchDto => {
  const body = asBody(raw);
  const patch: RoutePatchDto = {};
  if (body.name !== undefined) patch.name = requiredText(body.name, "name", 80);
  if (body.municipality !== undefined) patch.municipality = requiredText(body.municipality, "municipality", 60);
  if (body.description !== undefined) patch.description = optionalText(body.description, "description", 255);
  ensureNotEmpty(patch, "name, municipality, description");
  return patch;
};
