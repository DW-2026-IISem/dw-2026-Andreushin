// amount, totalWeightKg and weighingsCount are not accepted: the server computes them from the period's weighings.
// New settlements always start as "pending"; the state moves forward with PATCH { state }.
export interface CreateSettlementDto {
  recyclerId: number;
  periodStart: string; // "YYYY-MM-DD"
  periodEnd: string; // "YYYY-MM-DD", not in the future
  referenceCode?: string; // generated when omitted
  settlementDate?: string; // "YYYY-MM-DD"; defaults to today
  observations?: string | null;
}
