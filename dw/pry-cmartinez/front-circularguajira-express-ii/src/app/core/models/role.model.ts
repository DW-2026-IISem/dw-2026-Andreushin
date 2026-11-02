import { Status, Timestamps } from './api.model';

/** Table `roles` — /api/roles */
export interface Role extends Timestamps {
  id: number;
  name: string; // ADMIN, LOGISTICA, BASCULA, PLANTA, FINANZAS
  description: string | null;
  status: Status;
}

export interface RolePayload {
  name: string;
  description: string | null;
  status?: Status;
}

/** PUT/PATCH body: without `status` (only /deactivate changes it). */
export type RoleUpdatePayload = Omit<RolePayload, 'status'>;
