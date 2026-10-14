import { RoleUsersRepository } from "./role-users.repository";
import { RoleUser } from "./role-user.model";
import { UsersRepository } from "../users/users.repository";
import { RolesRepository } from "../roles/roles.repository";
import { ConflictError, NotFoundError } from "../../../shared/errors/httpError";
import { parseId } from "../../../shared/http/parseId";
import { parseRoleUserCreate } from "./dto/role-user.validation";

/**
 * Role assignments (user <-> role), first link of the RBAC chain.
 *  - Only an active role is assigned to an active user (an inactive link would grant nothing).
 *  - Assigning is idempotent on the unique pair: an inactive assignment is reactivated, an
 *    active one answers 409.
 *  - Revoking is logical (deactivate) and reversible (reactivate): the audit trail stays.
 * The effect is immediate: the next request reads the chain again (no cache to invalidate).
 */
export class RoleUsersService {
  constructor(
    private readonly roleUsersRepository = new RoleUsersRepository(),
    private readonly usersRepository = new UsersRepository(),
    private readonly rolesRepository = new RolesRepository()
  ) {}

  // ================== READ ==================

  getAll(): Promise<RoleUser[]> {
    return this.roleUsersRepository.findAllActive();
  }

  getOne(rawId: string): Promise<RoleUser> {
    return this.findOrFail(parseId(rawId), true);
  }

  // ================== CREATE (assign) ==================

  async assign(body: unknown): Promise<{ assignment: RoleUser; reactivated: boolean }> {
    const input = parseRoleUserCreate(body);
    const user = await this.usersRepository.findById(input.userId);
    if (!user || user.status !== "active") {
      throw new NotFoundError(`Usuario no encontrado o inactivo: ${input.userId}`);
    }
    const role = await this.rolesRepository.findById(input.roleId);
    if (!role || role.status !== "active") {
      throw new NotFoundError(`Rol no encontrado o inactivo: ${input.roleId}`);
    }

    const existing = await this.roleUsersRepository.findByUserAndRole(user.id, role.id);
    if (existing?.status === "active") {
      throw new ConflictError(`El usuario ${user.username} ya tiene el rol ${role.name}`);
    }
    const row = existing
      ? await this.roleUsersRepository.setStatus(existing, "active")
      : await this.roleUsersRepository.create(user.id, role.id);
    return { assignment: await this.findOrFail(row.id, false), reactivated: existing !== null };
  }

  // ================== STATE (revoke / restore) ==================

  async deactivate(rawId: string): Promise<RoleUser> {
    const assignment = await this.findOrFail(parseId(rawId), true);
    await this.roleUsersRepository.setStatus(assignment, "inactive");
    return assignment;
  }

  async reactivate(rawId: string): Promise<RoleUser> {
    const assignment = await this.findOrFail(parseId(rawId), false);
    if (assignment.status === "active") {
      throw new ConflictError("La asignación ya está activa");
    }
    await this.roleUsersRepository.setStatus(assignment, "active");
    return assignment;
  }

  // ================== HELPERS ==================

  private async findOrFail(id: number, onlyActive: boolean): Promise<RoleUser> {
    const assignment = await this.roleUsersRepository.findById(id);
    if (!assignment || (onlyActive && assignment.status !== "active")) {
      throw new NotFoundError("Asignación no encontrada" + (onlyActive ? " o inactiva" : ""));
    }
    return assignment;
  }
}
