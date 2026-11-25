import { BadRequestError } from "../../../../../../shared/errors/httpError";
import { asBody, positiveInt, requiredDate } from "../../../../../../shared/http/validation";
import { todayInColombia } from "../../../../materials/crud/material-rates/material-rates.service";
import { CollectionCreateDto, CollectionPatchDto, CollectionUpdateDto } from "./collection.dto";
import { ensureNotEmpty, line } from "../../weighings/dto/weighing.validation";

const MAX_ID = 2_147_483_647;
const MAX_LINES = 50;

// A delivery cannot be registered for a future day.
const collectionDate = (value: unknown): string => {
  const date = value === undefined ? todayInColombia() : requiredDate(value, "collectedOn");
  if (date > todayInColombia()) {
    throw new BadRequestError("collectedOn no puede ser una fecha futura");
  }
  return date;
};

export const parseCollectionCreate = (raw: unknown): CollectionCreateDto => {
  const body = asBody(raw);
  if (!Array.isArray(body.weighings) || body.weighings.length === 0) {
    throw new BadRequestError("La recolección requiere al menos un pesaje en weighings");
  }
  if (body.weighings.length > MAX_LINES) {
    throw new BadRequestError(`Máximo ${MAX_LINES} pesajes por recolección`);
  }
  return {
    recyclerId: positiveInt(body.recyclerId, "recyclerId", MAX_ID),
    routeId: positiveInt(body.routeId, "routeId", MAX_ID),
    collectedOn: collectionDate(body.collectedOn),
    weighings: body.weighings.map((item, index) => line(item, `el pesaje ${index + 1}`)),
  };
};

export const parseCollectionUpdate = (raw: unknown): CollectionUpdateDto => {
  const body = asBody(raw);
  return {
    recyclerId: positiveInt(body.recyclerId, "recyclerId", MAX_ID),
    routeId: positiveInt(body.routeId, "routeId", MAX_ID),
    collectedOn: collectionDate(body.collectedOn),
  };
};

export const parseCollectionPatch = (raw: unknown): CollectionPatchDto => {
  const body = asBody(raw);
  const patch: CollectionPatchDto = {};
  if (body.recyclerId !== undefined) patch.recyclerId = positiveInt(body.recyclerId, "recyclerId", MAX_ID);
  if (body.routeId !== undefined) patch.routeId = positiveInt(body.routeId, "routeId", MAX_ID);
  if (body.collectedOn !== undefined) patch.collectedOn = collectionDate(body.collectedOn);
  ensureNotEmpty(patch, "recyclerId, routeId, collectedOn");
  return patch;
};
