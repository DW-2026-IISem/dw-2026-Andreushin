import { UsersRepository } from "./users.repository";
import { User } from "./user.model";
import { EffectivePermission, EffectivePermissionsRepository } from "../access/effective-permissions.repository";
import { BadRequestError, ConflictError, NotFoundError } from "../../../shared/errors/httpError";
import { verifyPassword } from "../../../shared/auth/password";
import { parseId } from "../../../shared/http/parseId";
import { parseChangePassword, parseUserCreate, parseUserPatch, parseUserUpdate } from "./dto/user.validation";

/**
 * Users: identities of the plant staff. The password never comes in or goes out in plain
 * text (hashed by the model hooks, excluded from every response) and the effective
 * permissions are read from the RBAC chain, never stored on the user.
 */
export class UsersService {
  constructor(
    private readonly usersRepository = new UsersRepository(),
    private readonly effectivePermissionsRepository = new EffectivePermissionsRepository()
  ) {}

  // ================== READ ==================

  getAll(): Promise<User[]> {
    return this.usersRepository.findAllActive();
  }

  getOne(rawId: string): Promise<User> {
    return this.findActiveOrFail(parseId(rawId));
  }

  // (method, path) pairs the user reaches through active role and grant links.
  async getEffectivePermissions(rawId: string): Promise<EffectivePermission[]> {
    const user = await this.findActiveOrFail(parseId(rawId));
    return this.effectivePermissionsRepository.findForUser(user.id);
  }

  // ================== CREATE ==================

  async create(body: unknown): Promise<User> {
    const input = parseUserCreate(body);
    await this.ensureUnique(input.username, input.email);
    // Field by field on purpose (no mass assignment).
    const user = await this.usersRepository.create({
      username: input.username,
      email: input.email,
      password: input.password,
      avatar: input.avatar,
      status: input.status ?? "active",
    });
    return this.findOrFail(user.id);
  }

  // ================== UPDATE ==================

  // PUT: full replacement of the identity fields; an omitted avatar is cleared.
  async update(rawId: string, body: unknown): Promise<User> {
    const user = await this.findActiveOrFail(parseId(rawId));
    const input = parseUserUpdate(body);
    await this.ensureUnique(input.username, input.email, user.id);
    return this.usersRepository.update(user, input);
  }

  // PATCH: only the fields sent change.
  async patch(rawId: string, body: unknown): Promise<User> {
    const user = await this.findActiveOrFail(parseId(rawId));
    const changes = parseUserPatch(body);
    await this.ensureUnique(changes.username ?? user.username, changes.email ?? user.email, user.id);
    return this.usersRepository.update(user, changes);
  }

  // Verifies the current credential; the beforeUpdate hook hashes the new one.
  async changePassword(rawId: string, body: unknown): Promise<void> {
    const id = parseId(rawId);
    const input = parseChangePassword(body);
    const user = await this.usersRepository.findByIdWithPassword(id);
    if (!user || user.status !== "active") {
      throw new NotFoundError("Usuario no encontrado o inactivo");
    }
    if (!(await verifyPassword(input.currentPassword, user.password))) {
      throw new BadRequestError("La contraseña actual es incorrecta");
    }
    await this.usersRepository.update(user, { password: input.newPassword });
  }

  // ================== DELETE ==================

  // Physical delete: also purges an inactive user; 409 (FK RESTRICT) while it has role assignments.
  async delete(rawId: string): Promise<void> {
    const user = await this.findOrFail(parseId(rawId));
    await this.usersRepository.delete(user);
  }

  // Logical delete: immediate effect, `authenticate` stops recognizing the user (401).
  async deactivate(rawId: string): Promise<User> {
    const user = await this.findActiveOrFail(parseId(rawId));
    return this.usersRepository.update(user, { status: "inactive" });
  }

  // ================== HELPERS ==================

  private async findActiveOrFail(id: number): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user || user.status !== "active") {
      throw new NotFoundError("Usuario no encontrado o inactivo");
    }
    return user;
  }

  private async findOrFail(id: number): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundError("Usuario no encontrado");
    }
    return user;
  }

  // 409 with a useful message before the unique index turns it into a generic conflict.
  private async ensureUnique(username: string, email: string, ownId?: number): Promise<void> {
    const taken = (await this.usersRepository.findConflicts(username, email)).find((u) => u.id !== ownId);
    if (!taken) return;
    throw new ConflictError(
      taken.username === username ? `El usuario ${username} ya existe` : `El correo ${email} ya está en uso`
    );
  }
}
