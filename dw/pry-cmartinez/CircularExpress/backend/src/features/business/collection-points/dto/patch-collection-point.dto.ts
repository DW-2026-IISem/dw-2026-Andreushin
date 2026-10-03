import { CreateCollectionPointDto } from "./create-collection-point.dto";

// PATCH only touches the fields that are sent.
export type PatchCollectionPointDto = Partial<CreateCollectionPointDto>;
