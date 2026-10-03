import { Settlement, SettlementState, SettlementStatus } from "../settlement.model";

export interface SettlementLineDto {
  materialId: number;
  materialName: string;
  weighingsCount: number;
  netWeightKg: number;
  amount: number;
  unpricedWeighings: number; // weighings dated before the material's first rate (not paid)
}

export interface SettlementResponseDto {
  id: number;
  referenceCode: string;
  settlementDate: string;
  periodStart: string;
  periodEnd: string;
  totalWeightKg: number;
  weighingsCount: number;
  amount: number;
  state: SettlementState;
  observations: string | null;
  recyclerId: number;
  recycler: { id: number; name: string; documentNumber: string | null } | null;
  status: SettlementStatus;
  createdAt: Date;
  updatedAt: Date;
  breakdown?: SettlementLineDto[]; // included when the totals were just (re)calculated
}

export function toSettlementResponse(settlement: Settlement, breakdown?: SettlementLineDto[]): SettlementResponseDto {
  const { recycler } = settlement;
  return {
    id: settlement.id,
    referenceCode: settlement.referenceCode,
    settlementDate: settlement.settlementDate,
    periodStart: settlement.periodStart,
    periodEnd: settlement.periodEnd,
    totalWeightKg: settlement.totalWeightKg,
    weighingsCount: settlement.weighingsCount,
    amount: settlement.amount,
    state: settlement.state,
    observations: settlement.observations ?? null,
    recyclerId: settlement.recyclerId,
    recycler: recycler ? { id: recycler.id, name: recycler.name, documentNumber: recycler.documentNumber ?? null } : null,
    status: settlement.status,
    createdAt: settlement.createdAt,
    updatedAt: settlement.updatedAt,
    ...(breakdown && { breakdown }),
  };
}
