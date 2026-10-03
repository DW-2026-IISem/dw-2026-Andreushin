import { CreateCollectionDto } from "./create-collection.dto";

// PUT replaces the whole resource: omitted optional fields are cleared (description) or defaulted (date: today).
export type UpdateCollectionDto = CreateCollectionDto;
