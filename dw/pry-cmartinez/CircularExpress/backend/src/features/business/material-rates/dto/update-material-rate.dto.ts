import { CreateMaterialRateDto } from "./create-material-rate.dto";

// PUT replaces the whole resource: omitted optional fields are cleared (description) or defaulted (validFrom: today).
export type UpdateMaterialRateDto = CreateMaterialRateDto;
