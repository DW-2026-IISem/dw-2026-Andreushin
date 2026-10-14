import { ResourcesRepository } from "./resources.repository";
import { Resource } from "./resource.model";
import { ConflictError, NotFoundError } from "../../../shared/errors/httpError";
import { parseId } from "../../../shared/http/parseId";
import { parseResourceCreate, parseResourcePatch, parseResourceUpdate } from "./dto/resource.validation";

/**
 * Resources: the object of a permission, a (method, path) pattern. The pair is unique; it
 * is checked before writing so the client gets a useful 409.
 */
export class ResourcesService {
  constructor(private readonly resourcesRepository = new ResourcesRepository()) {}

  // ================== READ ==================

  getAll(): Promise<Resource[]> {
    return this.resourcesRepository.findAllActive();
  }

  getOne(rawId: string): Promise<Resource> {
    return this.findActiveOrFail(parseId(rawId));
  }

  // ================== CREATE ==================

  async create(body: unknown): Promise<Resource> {
    const input = parseResourceCreate(body);
    await this.ensureOperationIsFree(input.method, input.path);
    return this.resourcesRepository.create({
      method: input.method,
      path: input.path,
      description: input.description,
      status: input.status ?? "active",
    });
  }

  // ================== UPDATE ==================

  async update(rawId: string, body: unknown): Promise<Resource> {
    const resource = await this.findActiveOrFail(parseId(rawId));
    const input = parseResourceUpdate(body);
    await this.ensureOperationIsFree(input.method, input.path, resource.id);
    return this.resourcesRepository.update(resource, input);
  }

  async patch(rawId: string, body: unknown): Promise<Resource> {
    const resource = await this.findActiveOrFail(parseId(rawId));
    const changes = parseResourcePatch(body);
    await this.ensureOperationIsFree(changes.method ?? resource.method, changes.path ?? resource.path, resource.id);
    return this.resourcesRepository.update(resource, changes);
  }

  // ================== DELETE ==================

  // Physical delete: also purges an inactive resource; 409 (FK RESTRICT) while it is granted.
  async delete(rawId: string): Promise<void> {
    const resource = await this.resourcesRepository.findById(parseId(rawId));
    if (!resource) {
      throw new NotFoundError("Recurso no encontrado");
    }
    await this.resourcesRepository.delete(resource);
  }

  // Logical delete: no role can authorize this access point anymore (broken link).
  async deactivate(rawId: string): Promise<Resource> {
    const resource = await this.findActiveOrFail(parseId(rawId));
    return this.resourcesRepository.update(resource, { status: "inactive" });
  }

  // ================== HELPERS ==================

  private async findActiveOrFail(id: number): Promise<Resource> {
    const resource = await this.resourcesRepository.findById(id);
    if (!resource || resource.status !== "active") {
      throw new NotFoundError("Recurso no encontrado o inactivo");
    }
    return resource;
  }

  private async ensureOperationIsFree(method: string, path: string, ownId?: number): Promise<void> {
    const existing = await this.resourcesRepository.findByOperation(method, path);
    if (existing && existing.id !== ownId) {
      throw new ConflictError(`El recurso ${method} ${path} ya existe`);
    }
  }
}
