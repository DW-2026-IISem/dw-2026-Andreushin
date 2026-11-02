import { Status, Timestamps } from './api.model';

export type RecyclerType = 'independent' | 'organization';

/** Table `recyclers` — /api/recyclers */
export interface Recycler extends Timestamps {
  id: number;
  name: string;
  documentNumber: string;
  recyclerType: RecyclerType;
  phone: string;
  email: string | null;
  address: string | null;
  status: Status;
}

/** POST body. `status` is optional on create; edits never send it (only /deactivate changes it). */
export interface RecyclerPayload {
  name: string;
  documentNumber: string;
  recyclerType: RecyclerType;
  phone: string;
  email?: string | null;
  address?: string | null;
  status?: Status;
}

/** PUT/PATCH body: the same fields without `status`. */
export type RecyclerUpdatePayload = Omit<RecyclerPayload, 'status'>;
