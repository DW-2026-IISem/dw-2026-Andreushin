import { CollectionStatus } from "../collection.model";

export interface CreateCollectionDto {
  name: string;
  recyclerId: number;
  routeId: number;
  collectionDate?: string; // "YYYY-MM-DD"; defaults to today
  description?: string | null;
  status?: CollectionStatus;
}
