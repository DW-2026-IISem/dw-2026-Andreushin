import { RoleUser } from "./role-user.model";
import { Role } from "../roles/role.model";
import { User } from "../users/user.model";
import { SEED_USERS } from "../users/users.seeder";
import { RoleName } from "../resources/resource-catalog";

/**
 * Role assignments seeder: each canonical user gets the role with its own name
 * (admin -> ADMIN, bascula -> BASCULA...). Idempotent: an existing pair is reactivated
 * instead of duplicated.
 */
export async function seedRoleUsers(): Promise<number> {
  let created = 0;
  for (const { username } of SEED_USERS) {
    const roleName = username.toUpperCase() as RoleName;
    const user = await User.findOne({ where: { username } });
    const role = await Role.findOne({ where: { name: roleName } });
    if (!user || !role) {
      console.log(`⏭️  roleUsers: missing ${username} or ${roleName}, skipped`);
      continue;
    }
    const [assignment, wasCreated] = await RoleUser.findOrCreate({
      where: { userId: user.id, roleId: role.id },
      defaults: { userId: user.id, roleId: role.id, status: "active" },
    });
    if (wasCreated) created += 1;
    else if (assignment.status !== "active") await assignment.update({ status: "active" });
  }
  console.log(`✅ roleUsers: assignments reconciled (${SEED_USERS.length}, ${created} new)`);
  return created;
}
