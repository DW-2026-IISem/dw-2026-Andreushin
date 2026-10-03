import { Plant, PlantStatus } from "../plant.model";

export interface PlantResponseDto {
  id: number;
  name: string;
  municipality: string;
  address: string | null;
  description: string | null;
  status: PlantStatus;
  createdAt: Date;
  updatedAt: Date;
}

export function toPlantResponse(plant: Plant): PlantResponseDto {
  return {
    id: plant.id,
    name: plant.name,
    municipality: plant.municipality,
    address: plant.address ?? null,
    description: plant.description ?? null,
    status: plant.status,
    createdAt: plant.createdAt,
    updatedAt: plant.updatedAt,
  };
}
