import { MaterialStatus } from "../material.model";

export interface CreateMaterialDto {
  name: string;
  description?: string | null;
  status?: MaterialStatus;
}
