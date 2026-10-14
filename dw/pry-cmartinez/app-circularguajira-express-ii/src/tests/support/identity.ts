import { signAccessToken } from "../../shared/auth/jwt";
import { User } from "../../features/auth/users/user.model";
import { Role } from "../../features/auth/roles/role.model";
import { RoleUser } from "../../features/auth/role-users/role-user.model";
import { RoleName } from "../../features/auth/resources/resource-catalog";

export interface TestIdentity {
  user: User;
  token: string;
  // Removes the assignments and the user (call it in `after`).
  remove: () => Promise<void>;
}

/**
 * Throwaway user holding the given seeded roles, with a signed access token (login arrives
 * in ISS-15). Since ISS-13 every API route is JWT + RBAC, so a test caller needs real
 * grants: the roles and their matrix come from `npm run db:seed`.
 */
export const createTestIdentity = async (username: string, roleNames: readonly RoleName[]): Promise<TestIdentity> => {
  const user = await User.create({ username, email: `${username}@circularguajira.co`, password: "Clave2026!", status: "active" });
  for (const name of roleNames) {
    const role = await Role.findOne({ where: { name, status: "active" } });
    if (!role) {
      throw new Error(`Role ${name} not found: run npm run db:seed`);
    }
    await RoleUser.create({ userId: user.id, roleId: role.id, status: "active" });
  }
  return {
    user,
    token: signAccessToken(user).token,
    remove: async () => {
      await RoleUser.destroy({ where: { userId: user.id } });
      await user.destroy();
    },
  };
};
