import { Status, Timestamps } from './api.model';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

/** Table `resources` — /api/resources (catalog of 87 method + path pairs). */
export interface Resource extends Timestamps {
  id: number;
  method: HttpMethod;
  path: string;
  description: string | null;
  status: Status;
}

export interface ResourcePayload {
  method: HttpMethod;
  path: string;
  description: string | null;
  status?: Status;
}

/** PUT/PATCH body: without `status` (only /deactivate changes it). */
export type ResourceUpdatePayload = Omit<ResourcePayload, 'status'>;
