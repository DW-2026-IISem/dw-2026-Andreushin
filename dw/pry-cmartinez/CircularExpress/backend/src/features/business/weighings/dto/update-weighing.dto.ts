import { CreateWeighingDto } from "./create-weighing.dto";

// PUT replaces the whole resource: omitted optional fields are cleared (description, lot) or defaulted (tare: 0).
export type UpdateWeighingDto = CreateWeighingDto;
