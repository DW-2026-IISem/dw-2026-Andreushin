import { Route, RouteStatus } from "../route.model";

export interface RouteResponseDto {
  id: number;
  name: string;
  municipality: string;
  description: string | null;
  status: RouteStatus;
  createdAt: Date;
  updatedAt: Date;
}

export function toRouteResponse(route: Route): RouteResponseDto {
  return {
    id: route.id,
    name: route.name,
    municipality: route.municipality,
    description: route.description ?? null,
    status: route.status,
    createdAt: route.createdAt,
    updatedAt: route.updatedAt,
  };
}
