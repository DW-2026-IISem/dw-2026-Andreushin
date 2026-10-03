import { SettlementState } from "../settlement.model";
import { CreateSettlementDto } from "./create-settlement.dto";

// PATCH: any subset of the editable fields (recalculates when recycler or period change), and/or a state
// transition (pending → approved | rejected, approved → paid | rejected).
export type PatchSettlementDto = Partial<CreateSettlementDto> & { state?: SettlementState };
