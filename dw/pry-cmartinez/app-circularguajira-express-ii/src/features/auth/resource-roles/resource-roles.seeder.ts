import { Resource } from "../resources/resource.model";
import { Role } from "../roles/role.model";
import { ROLE_NAMES, resourcesForRole } from "../resources/resource-catalog";
import { ResourceRolesService } from "./resource-roles.service";

/**
 * Grants seeder: builds the permission matrix from resource-catalog.ts through
 * reconcileRole, so running it again reconciles (grants what is missing, reactivates,
 * revokes what is extra) and no role accumulates permissions by accident.
 */
export async function seedResourceRoles(): Promise<number> {
  const service = new ResourceRolesService();
  const resources = await Resource.findAll({ where: { status: "active" } });
  const idByOperation = new Map(resources.map((r) => [`${r.method} ${r.path}`, r.id]));

  let total = 0;
  for (const roleName of ROLE_NAMES) {
    const role = await Role.findOne({ where: { name: roleName } });
    if (!role) continue;
    const ids = resourcesForRole(roleName)
      .map((item) => idByOperation.get(`${item.method} ${item.path}`))
      .filter((id): id is number => id !== undefined);
    const result = await service.reconcileRole(role.id, ids);
    console.log(
      `✅ resourceRoles: ${roleName.padEnd(9)} -> ${result.totalActive} grant(s) (+${result.activated} / -${result.deactivated})`
    );
    total += result.totalActive;
  }
  return total;
}
