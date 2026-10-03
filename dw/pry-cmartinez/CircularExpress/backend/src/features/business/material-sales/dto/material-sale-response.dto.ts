import { MaterialSale, MaterialSaleStatus } from "../material-sale.model";

export interface MaterialSaleResponseDto {
  id: number;
  name: string;
  description: string | null;
  buyerName: string;
  saleDate: string;
  quantityKg: number;
  unitPricePerKg: number;
  totalAmount: number;
  materialLotId: number;
  // weightKg = lot stock after this operation
  materialLot: { id: number; name: string; weightKg: number; material: { id: number; name: string } | null } | null;
  status: MaterialSaleStatus;
  createdAt: Date;
  updatedAt: Date;
}

export function toMaterialSaleResponse(sale: MaterialSale): MaterialSaleResponseDto {
  const lot = sale.materialLot;
  return {
    id: sale.id,
    name: sale.name,
    description: sale.description ?? null,
    buyerName: sale.buyerName,
    saleDate: sale.saleDate,
    quantityKg: sale.quantityKg,
    unitPricePerKg: sale.unitPricePerKg,
    totalAmount: sale.totalAmount,
    materialLotId: sale.materialLotId,
    materialLot: lot
      ? {
          id: lot.id,
          name: lot.name,
          weightKg: lot.weightKg,
          material: lot.material ? { id: lot.material.id, name: lot.material.name } : null,
        }
      : null,
    status: sale.status,
    createdAt: sale.createdAt,
    updatedAt: sale.updatedAt,
  };
}
