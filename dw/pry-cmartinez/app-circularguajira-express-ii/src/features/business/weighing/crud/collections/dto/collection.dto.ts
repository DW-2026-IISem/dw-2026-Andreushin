import { WeighingLineDto } from "../../weighings/dto/weighing.dto";

// POST /api/collections: header + weighings, created in one transaction.
export interface CollectionCreateDto {
  recyclerId: number;
  routeId: number;
  collectedOn: string;
  weighings: WeighingLineDto[];
}

// PUT /api/collections/:id: header only (totals are derived; lines live in /api/weighings).
export interface CollectionUpdateDto {
  recyclerId: number;
  routeId: number;
  collectedOn: string;
}

// PATCH /api/collections/:id.
export type CollectionPatchDto = Partial<CollectionUpdateDto>;
