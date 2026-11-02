import { Money, Status, Timestamps } from './api.model';

/** Table `weighings` — /api/weighings. `netKg`, `pricePerKg` and `amount` are computed by Express. */
export interface Weighing extends Timestamps {
  id: number;
  collectionId: number;
  materialId: number;
  rateId: number;
  pricePerKg: Money;
  grossKg: Money;
  tareKg: Money;
  netKg: Money;
  amount: Money;
  status: Status;
}

/** One weighing line as sent by the UI: gross and tare only. */
export interface WeighingLineInput {
  materialId: number;
  grossKg: number;
  tareKg: number;
}

/** POST /api/weighings: adds a line to an open collection. */
export interface WeighingCreatePayload extends WeighingLineInput {
  collectionId: number;
}

/** PUT/PATCH /api/weighings/:id: only the scale readings can change. */
export interface WeighingUpdatePayload {
  grossKg: number;
  tareKg: number;
}
