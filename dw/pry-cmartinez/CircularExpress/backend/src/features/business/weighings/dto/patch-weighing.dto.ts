import { CreateWeighingDto } from "./create-weighing.dto";

// PATCH only touches the fields that are sent; net weight is recomputed when gross or tare change.
export type PatchWeighingDto = Partial<CreateWeighingDto>;
