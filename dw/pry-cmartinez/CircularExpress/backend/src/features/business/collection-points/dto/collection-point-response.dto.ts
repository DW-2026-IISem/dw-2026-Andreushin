import { CollectionPoint, CollectionPointStatus } from "../collection-point.model";

export interface CollectionPointResponseDto {
  id: number;
  name: string;
  address: string | null;
  description: string | null;
  routeId: number;
  route: { id: number; name: string; municipality: string } | null;
  status: CollectionPointStatus;
  createdAt: Date;
  updatedAt: Date;
}

export function toCollectionPointResponse(point: CollectionPoint): CollectionPointResponseDto {
  return {
    id: point.id,
    name: point.name,
    address: point.address ?? null,
    description: point.description ?? null,
    routeId: point.routeId,
    route: point.route ? { id: point.route.id, name: point.route.name, municipality: point.route.municipality } : null,
    status: point.status,
    createdAt: point.createdAt,
    updatedAt: point.updatedAt,
  };
}
