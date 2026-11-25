import { BadRequestError } from "../../../../../../shared/errors/httpError";
import { asBody, positiveAmount, requiredDate } from "../../../../../../shared/http/validation";
import { MaterialRateCreateDto } from "./material-rate.dto";

const MAX_PRICE_PER_KG = 9_999_999.99;

export const parseMaterialRateCreate = (raw: unknown): MaterialRateCreateDto => {
  const body = asBody(raw);
  const input: MaterialRateCreateDto = {
    pricePerKg: positiveAmount(body.pricePerKg, "pricePerKg", MAX_PRICE_PER_KG),
    validFrom: requiredDate(body.validFrom, "validFrom"),
    validTo: body.validTo === undefined || body.validTo === null ? null : requiredDate(body.validTo, "validTo"),
  };
  if (input.validTo !== null && input.validTo < input.validFrom) {
    throw new BadRequestError("validTo no puede ser anterior a validFrom");
  }
  return input;
};
