import { Recycler, RecyclerStatus } from "../recycler.model";

export interface RecyclerResponseDto {
  id: number;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  documentNumber: string | null;
  status: RecyclerStatus;
  createdAt: Date;
  updatedAt: Date;
}

export function toRecyclerResponse(recycler: Recycler): RecyclerResponseDto {
  return {
    id: recycler.id,
    name: recycler.name,
    description: recycler.description ?? null,
    phone: recycler.phone ?? null,
    email: recycler.email ?? null,
    documentNumber: recycler.documentNumber ?? null,
    status: recycler.status,
    createdAt: recycler.createdAt,
    updatedAt: recycler.updatedAt,
  };
}
