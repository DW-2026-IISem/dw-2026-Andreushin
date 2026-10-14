import { User } from "./users/user.model";
import { Role } from "./roles/role.model";
import { Resource } from "./resources/resource.model";
import { RoleUser } from "./role-users/role-user.model";
import { ResourceRole } from "./resource-roles/resource-role.model";
import { RefreshToken } from "./refresh-tokens/refresh-token.model";

/**
 * The whole RBAC graph in one file, because authorization is a chain across five tables:
 *
 *   User --N:M (RoleUser)--> Role --N:M (ResourceRole)--> Resource (method, path)
 *   User --1:N--> RefreshToken
 *
 * The aliases (`as`) are the ones the RBAC queries include; changing one means reviewing them.
 */

// A grant knows both ends of the permission.
ResourceRole.belongsTo(Role, { foreignKey: "roleId", as: "role" });
ResourceRole.belongsTo(Resource, { foreignKey: "resourceId", as: "resource" });
Role.hasMany(ResourceRole, { foreignKey: "roleId", as: "resourceRoles" });
Resource.hasMany(ResourceRole, { foreignKey: "resourceId", as: "resourceRoles" });

// An assignment knows its user and role (first link of the chain).
RoleUser.belongsTo(User, { foreignKey: "userId", as: "user" });
RoleUser.belongsTo(Role, { foreignKey: "roleId", as: "role" });
User.hasMany(RoleUser, { foreignKey: "userId", as: "roleUsers" });
Role.hasMany(RoleUser, { foreignKey: "roleId", as: "roleUsers" });

// Sessions belong to a user.
RefreshToken.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasMany(RefreshToken, { foreignKey: "userId", as: "refreshTokens" });
