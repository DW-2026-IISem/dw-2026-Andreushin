import { RolesRepository } from "./roles.repository";
import { Role } from "./role.model";
import { ConflictError, NotFoundError } from "../../../shared/errors/httpError";
import { parseId } from "../../../shared/http/parseId";
import { parseRoleCreate, parseRolePatch, parseRoleUpdate } from "./dto/role.validation";

/**
 * Roles: the subject of a permission. The name is unique but authorizes nothing by itself:
 * authorization comes only from the active grants in resource_roles (ISS-12).
 */
export class RolesService {
  constructor(private readonly rolesRepository = new RolesRepository()) {}

  // ================== READ ==================

  getAll(): Promise<Role[]> {
    return this.rolesRepository.findAllActive();
  }

  getOne(rawId: string): Promise<Role> {
    return this.findActiveOrFail(parseId(rawId));
  }

  // ================== CREATE ==================

  async create(body: unknown): Promise<Role> {
    const input = parseRoleCreate(body);
    await this.ensureNameIsFree(input.name);
    return this.rolesRepository.create({
      name: input.name,
      description: input.description,
      status: input.status ?? "active",
    });
  }

  // ================== UPDATE ==================

  async update(rawId: string, body: unknown): Promise<Role> {
    const role = await this.findActiveOrFail(parseId(rawId));
    const input = parseRoleUpdate(body);
    await this.ensureNameIsFree(input.name, role.id);
    return this.rolesRepository.update(role, input);
  }

  async patch(rawId: string, body: unknown): Promise<Role> {
    const role = await this.findActiveOrFail(parseId(rawId));
    const changes = parseRolePatch(body);
    if (changes.name !== undefined) await this.ensureNameIsFree(changes.name, role.id);
    return this.rolesRepository.update(role, changes);
  }

  // ================== DELETE ==================

  // Physical delete: also purges an inactive role; 409 (FK RESTRICT) while it has assignments or grants.
  async delete(rawId: string): Promise<void> {
    const role = await this.rolesRepository.findById(parseId(rawId));
    if (!role) {
      throw new NotFoundError("Rol no encontrado");
    }
    await this.rolesRepository.delete(role);
  }

  // Logical delete: immediate effect, every user of the role loses its grants (broken link).
  async deactivate(rawId: string): Promise<Role> {
    const role = await this.findActiveOrFail(parseId(rawId));
    return this.rolesRepository.update(role, { status: "inactive" });
  }

  // ================== HELPERS ==================

  private async findActiveOrFail(id: number): Promise<Role> {
    const role = await this.rolesRepository.findById(id);
    if (!role || role.status !== "active") {
      throw new NotFoundError("Rol no encontrado o inactivo");
    }
    return role;
  }

  private async ensureNameIsFree(name: string, ownId?: number): Promise<void> {
    const existing = await this.rolesRepository.findByName(name);
    if (existing && existing.id !== ownId) {
      throw new ConflictError(`Ya existe el rol ${name}`);
    }
  }
}
