import { Money, Timestamps } from './api.model';

/** Table `material_rates` — /api/materials/:id/rates. Rates are never edited: a new one is issued. */
export interface MaterialRate extends Timestamps {
  id: number;
  materialId: number;
  pricePerKg: Money; // DECIMAL(12,2): the backend converts it, but the type stays defensive
  validFrom: string;
  validTo: string | null;
}

export interface MaterialRatePayload {
  pricePerKg: number;
  validFrom: string;
  validTo: string | null;
}
