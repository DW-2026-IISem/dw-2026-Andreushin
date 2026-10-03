import { CreateRecyclerDto } from "./create-recycler.dto";

// PATCH only touches the fields that are sent.
export type PatchRecyclerDto = Partial<CreateRecyclerDto>;
