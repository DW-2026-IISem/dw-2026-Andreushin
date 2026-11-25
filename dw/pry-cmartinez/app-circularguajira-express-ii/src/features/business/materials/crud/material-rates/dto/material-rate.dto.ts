// POST /api/materials/:id/rates.
export interface MaterialRateCreateDto {
  pricePerKg: number;
  validFrom: string;
  validTo: string | null;
}
