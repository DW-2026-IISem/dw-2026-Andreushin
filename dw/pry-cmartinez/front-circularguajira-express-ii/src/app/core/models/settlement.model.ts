import { Money, Timestamps } from './api.model';
import { Weighing } from './weighing.model';

export type SettlementStatus = 'issued' | 'voided';

/** Table `settlements` — /api/settlements. Amounts are frozen; a wrong one is voided, never edited. */
export interface Settlement extends Timestamps {
  id: number;
  collectionId: number;
  recyclerId: number;
  settledAt: string;
  totalNetKg: Money;
  totalAmount: Money;
  lineCount: number;
  status: SettlementStatus;
  notes: string | null;
  weighings?: Weighing[];
}

export interface SettlementCreatePayload {
  collectionId: number;
  notes: string | null;
}

/** PUT/PATCH /api/settlements/:id: only the notes can change. */
export interface SettlementNotesPayload {
  notes: string | null;
}

export interface SettlementTotals {
  totalNetKg: number;
  totalAmount: number;
  lineCount: number;
}

export interface VerifiedLine {
  weighingId: number;
  materialId: number;
  grossKg: number;
  tareKg: number;
  netKg: number;
  pricePerKg: number;
  amount: number;
  rateId: number;
  rateValidFrom: string | null;
  rateValidTo: string | null;
  netOk: boolean;
  amountOk: boolean;
  rateOk: boolean;
}

/** GET /api/settlements/:id/verify */
export interface SettlementVerification {
  settlementId: number;
  status: SettlementStatus;
  collectionId: number;
  collectedOn: string;
  consistent: boolean;
  stored: SettlementTotals;
  recomputed: SettlementTotals;
  lines: VerifiedLine[];
}
