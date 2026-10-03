import { CreateRouteDto } from "./create-route.dto";

// PATCH only touches the fields that are sent.
export type PatchRouteDto = Partial<CreateRouteDto>;
