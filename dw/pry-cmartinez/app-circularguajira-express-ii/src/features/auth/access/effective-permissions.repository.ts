import { Resource } from "../resources/resource.model";
import { ResourceRole } from "../resource-roles/resource-role.model";
import { Role } from "../roles/role.model";
import { RoleUser } from "../role-users/role-user.model";

export interface EffectivePermission {
  resourceId: number;
  method: string;
  path: string;
}

/**
 * The authorization query: resources a user reaches through ACTIVE links only
 *
 *   role_users (user, active) -> roles (active) -> resource_roles (active) -> resources (active)
 *
 * Any inactive link breaks the chain. Used by GET /api/users/:id/permissions now and by
 * `authorize` (ISS-13), so both always agree.
 */
export class EffectivePermissionsRepository {
  async findForUser(userId: number): Promise<EffectivePermission[]> {
    const resources = await Resource.findAll({
      attributes: ["id", "method", "path"],
      where: { status: "active" },
      include: [
        {
          model: ResourceRole,
          as: "resourceRoles",
          attributes: [],
          required: true,
          where: { status: "active" },
          include: [
            {
              model: Role,
              as: "role",
              attributes: [],
              required: true,
              where: { status: "active" },
              include: [
                { model: RoleUser, as: "roleUsers", attributes: [], required: true, where: { status: "active", userId } },
              ],
            },
          ],
        },
      ],
      order: [
        ["path", "ASC"],
        ["method", "ASC"],
      ],
    });
    // A resource granted by two roles appears once.
    const unique = new Map(resources.map((r) => [r.id, { resourceId: r.id, method: r.method, path: r.path }]));
    return [...unique.values()];
  }
}
