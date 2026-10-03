import { CreateSettlementDto } from "./create-settlement.dto";

// PUT replaces the editable fields of a *pending* settlement and recalculates its totals.
export type UpdateSettlementDto = CreateSettlementDto;
