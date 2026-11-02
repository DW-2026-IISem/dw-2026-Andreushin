import { Status, Timestamps } from './api.model';
import { HttpMethod } from './resource.model';

/** Pivot `resource_roles` — /api/resource-roles. Each row IS a permission; the list is `{ grants }`. */
export interface ResourceRole extends Timestamps {
  id: number;
  roleId: number;
  resourceId: number;
  status: Status;
  role?: { id: number; name: string } | null;
  resource?: { id: number; method: HttpMethod; path: string; description: string | null } | null;
}

export interface ResourceRolePayload {
  roleId: number;
  resourceId: number;
}

/** Query filters of GET /api/resource-roles. */
export interface ResourceRoleFilters {
  roleId?: number;
  resourceId?: number;
}
