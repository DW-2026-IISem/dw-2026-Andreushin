// POST /api/settlements: settles one collection (totals are computed, never sent).
export interface SettlementCreateDto {
  collectionId: number;
  notes: string | null;
}

// PUT / PATCH /api/settlements/:id: only the notes; amounts are frozen.
export interface SettlementNotesDto {
  notes: string | null;
}
