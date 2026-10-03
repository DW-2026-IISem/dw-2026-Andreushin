import { CreateMaterialDto } from "./create-material.dto";

// PATCH only touches the fields that are sent.
export type PatchMaterialDto = Partial<CreateMaterialDto>;
