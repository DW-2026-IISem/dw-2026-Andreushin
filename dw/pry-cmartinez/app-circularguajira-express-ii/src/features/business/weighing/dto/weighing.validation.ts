import { BadRequestError } from "../../../../shared/errors/httpError";
import {
  asBody,
  Body,
  nonNegativeAmount,
  positiveAmount,
  positiveInt,
  requiredDate,
} from "../../../../shared/http/validation";
import { todayInColombia } from "../../materials/material-rates.service";
import {
  CollectionCreateDto,
  CollectionPatchDto,
  CollectionUpdateDto,
  WeighingCreateDto,
  WeighingLineDto,
  WeighingPatchDto,
  WeighingUpdateDto,
} from "./weighing.dto";

const MAX_ID = 2_147_483_647;
const MAX_KG = 100_000;
const MAX_LINES = 50;

// A delivery cannot be registered for a future day.
const collectionDate = (value: unknown): string => {
  const date = value === undefined ? todayInColombia() : requiredDate(value, "collectedOn");
  if (date > todayInColombia()) {
    throw new BadRequestError("collectedOn no puede ser una fecha futura");
  }
  return date;
};

// Gross must exceed tare: the net weight is what gets paid.
export const ensureNetWeight = (grossKg: number, tareKg: number, label = "el pesaje"): void => {
  if (grossKg <= tareKg) {
    throw new BadRequestError(`En ${label} el peso bruto (${grossKg}) debe ser mayor que la tara (${tareKg})`);
  }
};

const weights = (body: Body, label: string): WeighingUpdateDto => {
  const grossKg = positiveAmount(body.grossKg, "grossKg", MAX_KG);
  const tareKg = nonNegativeAmount(body.tareKg ?? 0, "tareKg", MAX_KG);
  ensureNetWeight(grossKg, tareKg, label);
  return { grossKg, tareKg };
};

const line = (raw: unknown, label: string): WeighingLineDto => {
  const body = asBody(raw);
  return { materialId: positiveInt(body.materialId, "materialId", MAX_ID), ...weights(body, label) };
};

const ensureNotEmpty = (patch: object, fields: string): void => {
  if (Object.keys(patch).length === 0) {
    throw new BadRequestError(`Envía al menos un campo para actualizar (${fields})`);
  }
};

// ================== COLLECTIONS ==================

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

// ================== WEIGHINGS ==================

export const parseWeighingCreate = (raw: unknown): WeighingCreateDto => {
  const body = asBody(raw);
  return { collectionId: positiveInt(body.collectionId, "collectionId", MAX_ID), ...line(body, "el pesaje") };
};

export const parseWeighingUpdate = (raw: unknown): WeighingUpdateDto => weights(asBody(raw), "el pesaje");

// Partial weights; the gross > tare rule is checked by the service against stored values.
export const parseWeighingPatch = (raw: unknown): WeighingPatchDto => {
  const body = asBody(raw);
  const patch: WeighingPatchDto = {};
  if (body.grossKg !== undefined) patch.grossKg = positiveAmount(body.grossKg, "grossKg", MAX_KG);
  if (body.tareKg !== undefined) patch.tareKg = nonNegativeAmount(body.tareKg, "tareKg", MAX_KG);
  ensureNotEmpty(patch, "grossKg, tareKg");
  return patch;
};
