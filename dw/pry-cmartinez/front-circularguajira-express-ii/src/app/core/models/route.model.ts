import { Status, Timestamps } from './api.model';

/** Table `routes` — /api/routes (collection routes). */
export interface Route extends Timestamps {
  id: number;
  name: string;
  municipality: string;
  description: string | null;
  status: Status;
}

export interface RoutePayload {
  name: string;
  municipality: string;
  description?: string | null;
  status?: Status;
}

/** PUT/PATCH body: without `status` (only /deactivate changes it). */
export type RouteUpdatePayload = Omit<RoutePayload, 'status'>;
