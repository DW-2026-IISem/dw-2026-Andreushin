import { Material, MaterialStatus } from "../material.model";

export interface MaterialResponseDto {
  id: number;
  name: string;
  description: string | null;
  status: MaterialStatus;
  createdAt: Date;
  updatedAt: Date;
}

export function toMaterialResponse(material: Material): MaterialResponseDto {
  return {
    id: material.id,
    name: material.name,
    description: material.description ?? null,
    status: material.status,
    createdAt: material.createdAt,
    updatedAt: material.updatedAt,
  };
}
