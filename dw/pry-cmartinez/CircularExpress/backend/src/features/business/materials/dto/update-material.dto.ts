import { CreateMaterialDto } from "./create-material.dto";

// PUT replaces the whole resource: omitted optional fields are cleared to null.
export type UpdateMaterialDto = CreateMaterialDto;
