import { Status, Timestamps } from './api.model';

/** Pivot `role_users` — /api/role-users. The list comes wrapped as `{ assignments }`. */
export interface RoleUser extends Timestamps {
  id: number;
  userId: number;
  roleId: number;
  status: Status;
  user?: { id: number; username: string; email: string } | null;
  role?: { id: number; name: string } | null;
}

export interface RoleUserPayload {
  userId: number;
  roleId: number;
}
