import { CreateRouteDto } from "./create-route.dto";

// PUT replaces the whole resource: omitted optional fields are cleared to null.
export type UpdateRouteDto = CreateRouteDto;
