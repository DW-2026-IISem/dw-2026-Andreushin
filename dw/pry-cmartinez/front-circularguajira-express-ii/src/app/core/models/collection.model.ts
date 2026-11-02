import { Money, Status, Timestamps } from './api.model';
import { Weighing, WeighingLineInput } from './weighing.model';

/** Table `collections` — /api/collections. Totals are computed by Express from its weighings. */
export interface Collection extends Timestamps {
  id: number;
  recyclerId: number;
  routeId: number;
  collectedOn: string;
  totalNetKg: Money;
  totalAmount: Money;
  status: Status;
  /** The backend includes the active weighings (`as: 'weighings'`). */
  weighings?: Weighing[];
}

/** POST body: no totals — Express calculates them with the rate in force on `collectedOn`. */
export interface CollectionCreatePayload {
  recyclerId: number;
  routeId: number;
  collectedOn: string;
  weighings: WeighingLineInput[];
}

export interface CollectionUpdatePayload {
  recyclerId: number;
  routeId: number;
  collectedOn: string;
}
