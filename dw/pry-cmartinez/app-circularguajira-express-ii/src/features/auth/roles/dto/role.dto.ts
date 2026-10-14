import { RoleStatus } from "../role.model";

// POST /api/roles. A new role is born WITHOUT permissions (grants are ISS-12).
export interface RoleCreateDto {
  name: string;
  description: string | null;
  status?: RoleStatus;
}

// PUT /api/roles/:id (full replacement). No status: it only changes via deactivate.
export interface RoleUpdateDto {
  name: string;
  description: string | null;
}

// PATCH /api/roles/:id.
export type RolePatchDto = Partial<RoleUpdateDto>;
