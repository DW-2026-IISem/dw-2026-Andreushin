// One weighing line inside POST /api/collections.
export interface WeighingLineDto {
  materialId: number;
  grossKg: number;
  tareKg: number;
}

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
