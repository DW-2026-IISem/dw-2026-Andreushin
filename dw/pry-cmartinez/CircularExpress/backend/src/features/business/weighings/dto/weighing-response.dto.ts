import { Weighing, WeighingStatus } from "../weighing.model";

export interface WeighingResponseDto {
  id: number;
  name: string;
  description: string | null;
  grossWeightKg: number;
  tareWeightKg: number;
  netWeightKg: number;
  collectionId: number;
  collection: { id: number; name: string; collectionDate: string } | null;
  materialId: number;
  material: { id: number; name: string } | null;
  materialLotId: number | null;
  materialLot: { id: number; name: string; weightKg: number } | null; // weightKg = lot stock after this operation
  status: WeighingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export function toWeighingResponse(weighing: Weighing): WeighingResponseDto {
  const { collection, material, materialLot } = weighing;
  return {
    id: weighing.id,
    name: weighing.name,
    description: weighing.description ?? null,
    grossWeightKg: weighing.grossWeightKg,
    tareWeightKg: weighing.tareWeightKg,
    netWeightKg: weighing.netWeightKg,
    collectionId: weighing.collectionId,
    collection: collection ? { id: collection.id, name: collection.name, collectionDate: collection.collectionDate } : null,
    materialId: weighing.materialId,
    material: material ? { id: material.id, name: material.name } : null,
    materialLotId: weighing.materialLotId ?? null,
    materialLot: materialLot ? { id: materialLot.id, name: materialLot.name, weightKg: materialLot.weightKg } : null,
    status: weighing.status,
    createdAt: weighing.createdAt,
    updatedAt: weighing.updatedAt,
  };
}
