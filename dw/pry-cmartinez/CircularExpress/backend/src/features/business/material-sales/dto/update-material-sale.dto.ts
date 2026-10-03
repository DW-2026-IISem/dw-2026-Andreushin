import { CreateMaterialSaleDto } from "./create-material-sale.dto";

// PUT replaces the whole resource: omitted optional fields are cleared (description) or defaulted (saleDate: today).
export type UpdateMaterialSaleDto = CreateMaterialSaleDto;
