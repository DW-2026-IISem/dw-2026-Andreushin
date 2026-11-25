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

// POST /api/resource-roles/reconcile: the COMPLETE set a role must hold afterwards (the panel
// saves the whole matrix at once). An empty list is deliberate: it revokes every grant.
export interface ResourceRoleReconcileDto {
  roleId: number;
  resourceIds: number[];
}
