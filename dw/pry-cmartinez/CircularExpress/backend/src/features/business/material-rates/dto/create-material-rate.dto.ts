import { MaterialRateStatus } from "../material-rate.model";

export interface CreateMaterialRateDto {
  name: string;
  materialId: number;
  pricePerKg: number;
  validFrom?: string; // "YYYY-MM-DD"; defaults to today
  description?: string | null;
  status?: MaterialRateStatus;
}
