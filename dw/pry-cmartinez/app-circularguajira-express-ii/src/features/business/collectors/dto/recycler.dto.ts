import { RecyclerStatus, RecyclerType } from "../recycler.model";

// Full payload: required on create and on PUT.
export interface RecyclerInputDto {
  name: string;
  documentNumber: string;
  recyclerType: RecyclerType;
  phone: string;
  email?: string | null;
  address?: string | null;
  status?: RecyclerStatus;
}

// Partial payload for PATCH.
export type RecyclerPatchDto = Partial<RecyclerInputDto>;
