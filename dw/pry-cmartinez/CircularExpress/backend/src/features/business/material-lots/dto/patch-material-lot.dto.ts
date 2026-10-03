import { UpdateMaterialLotDto } from "./update-material-lot.dto";

// PATCH only touches the fields that are sent (weightKg excluded, like PUT).
export type PatchMaterialLotDto = Partial<UpdateMaterialLotDto>;
