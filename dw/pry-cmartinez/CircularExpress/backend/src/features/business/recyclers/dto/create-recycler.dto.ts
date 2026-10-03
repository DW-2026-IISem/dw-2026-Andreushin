import { RecyclerStatus } from "../recycler.model";

export interface CreateRecyclerDto {
  name: string;
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  documentNumber?: string | null;
  status?: RecyclerStatus;
}
