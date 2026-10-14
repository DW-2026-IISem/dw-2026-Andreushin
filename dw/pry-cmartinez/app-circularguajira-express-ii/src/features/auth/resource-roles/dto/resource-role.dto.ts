// POST /api/resource-roles: grant a resource to a role. This row IS the permission.
export interface ResourceRoleCreateDto {
  roleId: number;
  resourceId: number;
}

// GET /api/resource-roles filters: the permissions of a role, or the roles granting a resource.
export interface ResourceRoleFilters {
  roleId?: number;
  resourceId?: number;
}
