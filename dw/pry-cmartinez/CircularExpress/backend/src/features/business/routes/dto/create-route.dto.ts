import { RouteStatus } from "../route.model";

export interface CreateRouteDto {
  name: string;
  municipality: string;
  description?: string | null;
  status?: RouteStatus;
}
