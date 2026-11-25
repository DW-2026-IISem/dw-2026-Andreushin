import { CollectionPointStatus } from "../collection-point.model";

// POST /api/collection-points.
export interface CollectionPointCreateDto {
  routeId: number;
  name: string;
  address: string;
  visitOrder: number;
  status?: CollectionPointStatus;
}

// PUT /api/collection-points/:id (full replacement, may move the point to another route).
export interface CollectionPointUpdateDto {
  routeId: number;
  name: string;
  address: string;
  visitOrder: number;
}

// PATCH /api/collection-points/:id.
export type CollectionPointPatchDto = Partial<CollectionPointUpdateDto>;
