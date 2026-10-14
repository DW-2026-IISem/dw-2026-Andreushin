import { ResourceRolesRepository } from "./resource-roles.repository";
import { ResourceRole } from "./resource-role.model";
import { RolesRepository } from "../roles/roles.repository";
import { ResourcesRepository } from "../resources/resources.repository";
import { ConflictError, NotFoundError } from "../../../shared/errors/httpError";
import { parseId } from "../../../shared/http/parseId";
import { withTransaction } from "../../../shared/database/transaction";
import { parseResourceRoleCreate, parseResourceRoleFilters } from "./dto/resource-role.validation";

export interface ReconcileResult {
  roleId: number;
  activated: number;
  deactivated: number;
  totalActive: number;
}

/**
 * Grants (role <-> resource): where "Role + Resource = permission" becomes operational.
 * Granting, revoking and restoring are data, not code: no deploy, effect on the next request.
 * `reconcileRole` declares the exact set of a role (used by the seeder from the catalog).
 */
export class ResourceRolesService {
  constructor(
    private readonly resourceRolesRepository = new ResourceRolesRepository(),
    private readonly rolesRepository = new RolesRepository(),
    private readonly resourcesRepository = new ResourcesRepository()
  ) {}

  // ================== READ ==================

  getAll(query: Record<string, unknown>): Promise<ResourceRole[]> {
    return this.resourceRolesRepository.findAllActive(parseResourceRoleFilters(query));
  }

  getOne(rawId: string): Promise<ResourceRole> {
    return this.findOrFail(parseId(rawId), true);
  }

  // ================== CREATE (grant) ==================

  async grant(body: unknown): Promise<{ grant: ResourceRole; reactivated: boolean }> {
    const input = parseResourceRoleCreate(body);
    const role = await this.rolesRepository.findById(input.roleId);
    if (!role || role.status !== "active") {
      throw new NotFoundError(`Rol no encontrado o inactivo: ${input.roleId}`);
    }
    const resource = await this.resourcesRepository.findById(input.resourceId);
    if (!resource || resource.status !== "active") {
      throw new NotFoundError(`Recurso no encontrado o inactivo: ${input.resourceId}`);
    }

    const existing = await this.resourceRolesRepository.findByRoleAndResource(role.id, resource.id);
    if (existing?.status === "active") {
      throw new ConflictError(`El rol ${role.name} ya tiene ${resource.method} ${resource.path}`);
    }
    const row = existing
      ? await this.resourceRolesRepository.setStatus(existing, "active")
      : await this.resourceRolesRepository.create(role.id, resource.id);
    return { grant: await this.findOrFail(row.id, false), reactivated: existing !== null };
  }

  // ================== STATE (revoke / restore) ==================

  // Only that operation is lost; the other grants of the role remain.
  async deactivate(rawId: string): Promise<ResourceRole> {
    const grant = await this.findOrFail(parseId(rawId), true);
    await this.resourceRolesRepository.setStatus(grant, "inactive");
    return grant;
  }

  async reactivate(rawId: string): Promise<ResourceRole> {
    const grant = await this.findOrFail(parseId(rawId), false);
    if (grant.status === "active") {
      throw new ConflictError("La concesión ya está activa");
    }
    await this.resourceRolesRepository.setStatus(grant, "active");
    return grant;
  }

  // ================== RECONCILIATION ==================

  /**
   * Leaves the active grants of a role EXACTLY equal to `resourceIds`, in one transaction:
   * missing -> granted, inactive -> reactivated, extra active -> revoked (logical).
   * Total and deterministic: running it again changes nothing.
   */
  async reconcileRole(roleId: number, resourceIds: readonly number[]): Promise<ReconcileResult> {
    const role = await this.rolesRepository.findById(roleId);
    if (!role) {
      throw new NotFoundError(`Rol no encontrado: ${roleId}`);
    }
    const wanted = new Set(resourceIds);
    return withTransaction(async (transaction) => {
      const existing = await this.resourceRolesRepository.findAllByRole(roleId, transaction);
      const byResource = new Map(existing.map((row) => [row.resourceId, row]));
      let activated = 0;
      let deactivated = 0;

      for (const resourceId of wanted) {
        const row = byResource.get(resourceId);
        if (!row) {
          await this.resourceRolesRepository.create(roleId, resourceId, transaction);
          activated += 1;
        } else if (row.status !== "active") {
          await this.resourceRolesRepository.setStatus(row, "active", transaction);
          activated += 1;
        }
      }
      for (const row of existing) {
        if (!wanted.has(row.resourceId) && row.status === "active") {
          await this.resourceRolesRepository.setStatus(row, "inactive", transaction);
          deactivated += 1;
        }
      }
      return { roleId, activated, deactivated, totalActive: wanted.size };
    });
  }

  // ================== HELPERS ==================

  private async findOrFail(id: number, onlyActive: boolean): Promise<ResourceRole> {
    const grant = await this.resourceRolesRepository.findById(id);
    if (!grant || (onlyActive && grant.status !== "active")) {
      throw new NotFoundError("Concesión no encontrada" + (onlyActive ? " o inactiva" : ""));
    }
    return grant;
  }
}
