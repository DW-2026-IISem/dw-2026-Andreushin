import { CreateMaterialSaleDto } from "./create-material-sale.dto";

// PATCH only touches the fields that are sent; the total is recomputed when quantity or price change.
export type PatchMaterialSaleDto = Partial<CreateMaterialSaleDto>;
