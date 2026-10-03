import { MaterialLotStatus } from "../material-lot.model";

export interface CreateMaterialLotDto {
  name: string; // lot code, unique
  plantId: number;
  materialId: number;
  weightKg?: number; // initial stock, defaults to 0; afterwards only weighings and sales change it
  description?: string | null;
  status?: MaterialLotStatus;
}
