import { MaterialStatus } from "../material.model";

// POST /api/materials. Status defaults to active; afterwards it only changes via deactivate.
export interface MaterialCreateDto {
  name: string;
  description: string | null;
  status?: MaterialStatus;
}

// PUT /api/materials/:id (full replacement). No status on purpose: see deactivate.
export interface MaterialUpdateDto {
  name: string;
  description: string | null;
}

// PATCH /api/materials/:id.
export type MaterialPatchDto = Partial<MaterialUpdateDto>;

// POST /api/materials/:id/rates.
export interface MaterialRateCreateDto {
  pricePerKg: number;
  validFrom: string;
  validTo: string | null;
}
