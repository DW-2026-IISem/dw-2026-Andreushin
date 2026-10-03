import { MaterialSaleStatus } from "../material-sale.model";

// totalAmount is not accepted: the server computes quantityKg × unitPricePerKg.
export interface CreateMaterialSaleDto {
  name: string;
  buyerName: string;
  materialLotId: number;
  quantityKg: number;
  unitPricePerKg: number;
  saleDate?: string; // "YYYY-MM-DD"; defaults to today
  description?: string | null;
  status?: MaterialSaleStatus;
}
