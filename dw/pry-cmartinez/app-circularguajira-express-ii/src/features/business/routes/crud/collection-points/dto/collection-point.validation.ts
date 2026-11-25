import { BadRequestError } from "../../../../../../shared/errors/httpError";
import { asBody, Body, oneOf, positiveInt, requiredText } from "../../../../../../shared/http/validation";
import { CollectionPointStatus } from "../collection-point.model";
import { CollectionPointCreateDto, CollectionPointPatchDto, CollectionPointUpdateDto } from "./collection-point.dto";

const STATUSES: readonly CollectionPointStatus[] = ["active", "inactive"];
const MAX_ID = 2_147_483_647;
const MAX_VISIT_ORDER = 999;

const ensureNotEmpty = (patch: object, fields: string): void => {
  if (Object.keys(patch).length === 0) {
    throw new BadRequestError(`Envía al menos un campo para actualizar (${fields})`);
  }
};

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
