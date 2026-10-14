/**
 * Single source of the settlement formula, shared by the services, the settlement
 * verification and the seeders:
 *   netKg  = grossKg - tareKg
 *   amount = netKg * pricePerKg
 *   totals = sum of the active lines
 * Every value is rounded to 2 decimals (kg and COP) at each step.
 */

export const round2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

export interface LineValues {
  netKg: number;
  amount: number;
}

export interface Totals {
  totalNetKg: number;
  totalAmount: number;
  lineCount: number;
}

export const calculateLine = (grossKg: number, tareKg: number, pricePerKg: number): LineValues => {
  const netKg = round2(grossKg - tareKg);
  return { netKg, amount: round2(netKg * pricePerKg) };
};

export const sumLines = (lines: ReadonlyArray<LineValues>): Totals => ({
  totalNetKg: round2(lines.reduce((sum, line) => sum + line.netKg, 0)),
  totalAmount: round2(lines.reduce((sum, line) => sum + line.amount, 0)),
  lineCount: lines.length,
});
