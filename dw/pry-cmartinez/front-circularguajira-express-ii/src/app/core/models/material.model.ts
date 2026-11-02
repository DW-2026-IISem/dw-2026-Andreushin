import { Status, Timestamps } from './api.model';

/** Table `materials` — /api/materials */
export interface Material extends Timestamps {
  id: number;
  name: string;
  description: string | null;
  status: Status;
}

export interface MaterialPayload {
  name: string;
  description?: string | null;
  status?: Status;
}

/** PUT/PATCH body: without `status` (only /deactivate changes it). */
export type MaterialUpdatePayload = Omit<MaterialPayload, 'status'>;
