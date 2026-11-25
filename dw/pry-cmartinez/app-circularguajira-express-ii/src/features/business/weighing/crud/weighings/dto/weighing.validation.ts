import { BadRequestError } from "../../../../../../shared/errors/httpError";
import {
  asBody,
  Body,
  nonNegativeAmount,
  positiveAmount,
  positiveInt,
} from "../../../../../../shared/http/validation";
import { WeighingCreateDto, WeighingLineDto, WeighingPatchDto, WeighingUpdateDto } from "./weighing.dto";

const MAX_ID = 2_147_483_647;
const MAX_KG = 100_000;

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

// One weighing line (also used inside POST /api/collections).
export const line = (raw: unknown, label: string): WeighingLineDto => {
  const body = asBody(raw);
  return { materialId: positiveInt(body.materialId, "materialId", MAX_ID), ...weights(body, label) };
};

export const ensureNotEmpty = (patch: object, fields: string): void => {
  if (Object.keys(patch).length === 0) {
    throw new BadRequestError(`Envía al menos un campo para actualizar (${fields})`);
  }
};

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
