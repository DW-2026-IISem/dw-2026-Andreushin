import { BadRequestError } from "../../../../shared/errors/httpError";
import { asBody, Body, oneOf, optionalText, positiveInt, requiredText } from "../../../../shared/http/validation";
import { RouteStatus } from "../route.model";
import {
  CollectionPointCreateDto,
  CollectionPointPatchDto,
  CollectionPointUpdateDto,
  RouteCreateDto,
  RoutePatchDto,
  RouteUpdateDto,
} from "./route.dto";

const STATUSES: readonly RouteStatus[] = ["active", "inactive"];
const MAX_ID = 2_147_483_647;
const MAX_VISIT_ORDER = 999;

const ensureNotEmpty = (patch: object, fields: string): void => {
  if (Object.keys(patch).length === 0) {
    throw new BadRequestError(`Envía al menos un campo para actualizar (${fields})`);
  }
};

// ================== ROUTES ==================

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

// ================== COLLECTION POINTS ==================

const pointFields = (body: Body): CollectionPointUpdateDto => ({
  routeId: positiveInt(body.routeId, "routeId", MAX_ID),
  name: requiredText(body.name, "name", 100),
  address: requiredText(body.address, "address", 200),
  visitOrder: positiveInt(body.visitOrder, "visitOrder", MAX_VISIT_ORDER),
});

export const parseCollectionPointCreate = (raw: unknown): CollectionPointCreateDto => {
  const body = asBody(raw);
  const input: CollectionPointCreateDto = pointFields(body);
  if (body.status !== undefined) input.status = oneOf(body.status, "status", STATUSES);
  return input;
};

export const parseCollectionPointUpdate = (raw: unknown): CollectionPointUpdateDto => pointFields(asBody(raw));

export const parseCollectionPointPatch = (raw: unknown): CollectionPointPatchDto => {
  const body = asBody(raw);
  const patch: CollectionPointPatchDto = {};
  if (body.routeId !== undefined) patch.routeId = positiveInt(body.routeId, "routeId", MAX_ID);
  if (body.name !== undefined) patch.name = requiredText(body.name, "name", 100);
  if (body.address !== undefined) patch.address = requiredText(body.address, "address", 200);
  if (body.visitOrder !== undefined) patch.visitOrder = positiveInt(body.visitOrder, "visitOrder", MAX_VISIT_ORDER);
  ensureNotEmpty(patch, "routeId, name, address, visitOrder");
  return patch;
};
