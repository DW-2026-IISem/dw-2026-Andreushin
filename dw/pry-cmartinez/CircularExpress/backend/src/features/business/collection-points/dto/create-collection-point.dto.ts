import { CollectionPointStatus } from "../collection-point.model";

export interface CreateCollectionPointDto {
  name: string;
  routeId: number;
  address?: string | null;
  description?: string | null;
  status?: CollectionPointStatus;
}
