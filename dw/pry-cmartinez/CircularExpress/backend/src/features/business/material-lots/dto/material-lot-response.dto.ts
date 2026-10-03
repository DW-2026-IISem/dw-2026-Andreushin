import { MaterialLot, MaterialLotStatus } from "../material-lot.model";

export interface MaterialLotResponseDto {
  id: number;
  name: string;
  description: string | null;
  weightKg: number;
  plantId: number;
  plant: { id: number; name: string; municipality: string } | null;
  materialId: number;
  material: { id: number; name: string } | null;
  status: MaterialLotStatus;
  createdAt: Date;
  updatedAt: Date;
}

export function toMaterialLotResponse(lot: MaterialLot): MaterialLotResponseDto {
  const { plant, material } = lot;
  return {
    id: lot.id,
    name: lot.name,
    description: lot.description ?? null,
    weightKg: lot.weightKg,
    plantId: lot.plantId,
    plant: plant ? { id: plant.id, name: plant.name, municipality: plant.municipality } : null,
    materialId: lot.materialId,
    material: material ? { id: material.id, name: material.name } : null,
    status: lot.status,
    createdAt: lot.createdAt,
    updatedAt: lot.updatedAt,
  };
}
