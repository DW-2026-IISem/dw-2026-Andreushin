import { RouteStatus } from "../route.model";

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
