import { CreateCollectionDto } from "./create-collection.dto";

// PATCH only touches the fields that are sent.
export type PatchCollectionDto = Partial<CreateCollectionDto>;
