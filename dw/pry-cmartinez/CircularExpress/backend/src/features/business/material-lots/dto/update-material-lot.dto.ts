import { CreateMaterialLotDto } from "./create-material-lot.dto";

// PUT replaces the editable fields; weightKg is stock and cannot be replaced by hand.
export type UpdateMaterialLotDto = Omit<CreateMaterialLotDto, "weightKg">;
