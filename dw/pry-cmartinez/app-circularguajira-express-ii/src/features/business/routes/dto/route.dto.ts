import { RouteStatus } from "../route.model";
import { CollectionPointStatus } from "../collection-point.model";

// POST /api/routes. Status defaults to active; afterwards it only changes via deactivate.
export interface RouteCreateDto {
  name: string;
  municipality: string;
  description: string | null;
  status?: RouteStatus;
}

// PUT /api/routes/:id (full replacement). No status on purpose: see deactivate.
export interface RouteUpdateDto {
  name: string;
  municipality: string;
  description: string | null;
}

// PATCH /api/routes/:id.
export type RoutePatchDto = Partial<RouteUpdateDto>;

// POST /api/collection-points.
export interface CollectionPointCreateDto {
  routeId: number;
  name: string;
  address: string;
  visitOrder: number;
  status?: CollectionPointStatus;
}

// PUT /api/collection-points/:id (full replacement, may move the point to another route).
export interface CollectionPointUpdateDto {
  routeId: number;
  name: string;
  address: string;
  visitOrder: number;
}

// PATCH /api/collection-points/:id.
export type CollectionPointPatchDto = Partial<CollectionPointUpdateDto>;
