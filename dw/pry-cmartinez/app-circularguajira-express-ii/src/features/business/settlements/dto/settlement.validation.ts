import { BadRequestError } from "../../../../shared/errors/httpError";
import { asBody, optionalText, positiveInt } from "../../../../shared/http/validation";
import { SettlementCreateDto, SettlementNotesDto } from "./settlement.dto";

const MAX_ID = 2_147_483_647;

export const parseSettlementCreate = (raw: unknown): SettlementCreateDto => {
  const body = asBody(raw);
  return {
    collectionId: positiveInt(body.collectionId, "collectionId", MAX_ID),
    notes: optionalText(body.notes, "notes", 255),
  };
};

export const parseSettlementNotes = (raw: unknown): SettlementNotesDto => {
  const body = asBody(raw);
  if (body.notes === undefined) {
    throw new BadRequestError("Solo se pueden modificar las notas (notes); los valores liquidados no cambian");
  }
  return { notes: optionalText(body.notes, "notes", 255) };
};
