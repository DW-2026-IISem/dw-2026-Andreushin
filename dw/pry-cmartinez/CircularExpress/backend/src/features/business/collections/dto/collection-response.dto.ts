import { Collection, CollectionStatus } from "../collection.model";

export interface CollectionResponseDto {
  id: number;
  name: string;
  description: string | null;
  collectionDate: string;
  recyclerId: number;
  recycler: { id: number; name: string; documentNumber: string | null } | null;
  routeId: number;
  route: { id: number; name: string; municipality: string } | null;
  status: CollectionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export function toCollectionResponse(collection: Collection): CollectionResponseDto {
  const { recycler, route } = collection;
  return {
    id: collection.id,
    name: collection.name,
    description: collection.description ?? null,
    collectionDate: collection.collectionDate,
    recyclerId: collection.recyclerId,
    recycler: recycler ? { id: recycler.id, name: recycler.name, documentNumber: recycler.documentNumber ?? null } : null,
    routeId: collection.routeId,
    route: route ? { id: route.id, name: route.name, municipality: route.municipality } : null,
    status: collection.status,
    createdAt: collection.createdAt,
    updatedAt: collection.updatedAt,
  };
}
