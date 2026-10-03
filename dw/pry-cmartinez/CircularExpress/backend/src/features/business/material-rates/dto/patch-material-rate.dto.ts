import { CreateMaterialRateDto } from "./create-material-rate.dto";

// PATCH only touches the fields that are sent.
export type PatchMaterialRateDto = Partial<CreateMaterialRateDto>;
