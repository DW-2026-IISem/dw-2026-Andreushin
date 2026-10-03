import { MaterialRate, MaterialRateStatus } from "../material-rate.model";

export interface MaterialRateResponseDto {
  id: number;
  name: string;
  description: string | null;
  pricePerKg: number;
  validFrom: string;
  materialId: number;
  material: { id: number; name: string } | null;
  status: MaterialRateStatus;
  createdAt: Date;
  updatedAt: Date;
}

export function toMaterialRateResponse(rate: MaterialRate): MaterialRateResponseDto {
  return {
    id: rate.id,
    name: rate.name,
    description: rate.description ?? null,
    pricePerKg: rate.pricePerKg,
    validFrom: rate.validFrom,
    materialId: rate.materialId,
    material: rate.material ? { id: rate.material.id, name: rate.material.name } : null,
    status: rate.status,
    createdAt: rate.createdAt,
    updatedAt: rate.updatedAt,
  };
}
