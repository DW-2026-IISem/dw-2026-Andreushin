import { Money, toNumber } from '../models/api.model';

/**
 * Same formula as the backend (`weighing.calculator.ts`), used only to PREVIEW a draft:
 *   netKg  = grossKg - tareKg
 *   amount = netKg * pricePerKg
 * Every value is rounded to 2 decimals at each step. Express recalculates and stores the
 * real values with the rate in force on the collection date.
 */
export const round2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

export interface LinePreview {
  netKg: number;
  amount: number;
}

export function previewLine(
  grossKg: number,
  tareKg: number,
  pricePerKg: Money | null | undefined,
): LinePreview {
  const netKg = round2(grossKg - tareKg);
  return { netKg, amount: round2(netKg * toNumber(pricePerKg)) };
}

export function sumPreviews(lines: readonly LinePreview[]): LinePreview {
  return {
    netKg: round2(lines.reduce((sum, line) => sum + line.netKg, 0)),
    amount: round2(lines.reduce((sum, line) => sum + line.amount, 0)),
  };
}

/** Today in Colombia as `YYYY-MM-DD` (the backend rejects future collection dates). */
export function todayInColombia(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(now);
}
