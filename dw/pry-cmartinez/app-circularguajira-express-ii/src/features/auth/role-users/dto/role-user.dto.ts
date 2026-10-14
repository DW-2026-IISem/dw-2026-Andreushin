// POST /api/role-users: assign a role to a user (first link of the authorization chain).
export interface RoleUserCreateDto {
  userId: number;
  roleId: number;
}
