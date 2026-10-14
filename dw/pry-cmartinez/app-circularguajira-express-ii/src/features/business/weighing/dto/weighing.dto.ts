// One weighing line inside POST /api/collections.
export interface WeighingLineDto {
  materialId: number;
  grossKg: number;
  tareKg: number;
}

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

// POST /api/weighings: adds a line to an open collection.
export interface WeighingCreateDto extends WeighingLineDto {
  collectionId: number;
}

// PUT /api/weighings/:id. Collection and material are immutable; the rate follows the date.
export interface WeighingUpdateDto {
  grossKg: number;
  tareKg: number;
}

// PATCH /api/weighings/:id.
export type WeighingPatchDto = Partial<WeighingUpdateDto>;
