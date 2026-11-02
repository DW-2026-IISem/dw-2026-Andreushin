import { Status, Timestamps } from './api.model';

/** Table `collection_points` — /api/collection-points and /api/routes/:id/points */
export interface CollectionPoint extends Timestamps {
  id: number;
  routeId: number;
  name: string;
  address: string;
  visitOrder: number;
  status: Status;
}

export interface CollectionPointPayload {
  routeId: number;
  name: string;
  address: string;
  visitOrder: number;
  status?: Status;
}

/** PUT/PATCH body: without `status` (only /deactivate changes it). */
export type CollectionPointUpdatePayload = Omit<CollectionPointPayload, 'status'>;
