import { MaterialsRepository } from "./materials.repository";
import { MaterialRatesRepository } from "./material-rates.repository";
import { Material } from "./material.model";
import { ConflictError, NotFoundError } from "../../../shared/errors/httpError";
import { parseId } from "../../../shared/http/parseId";
import { parseMaterialCreate, parseMaterialPatch, parseMaterialUpdate } from "./dto/material.validation";

export class MaterialsService {
  constructor(
    private readonly materialsRepository = new MaterialsRepository(),
    private readonly materialRatesRepository = new MaterialRatesRepository()
  ) {}

  // ================== READ ==================

  getAll(): Promise<Material[]> {
    return this.materialsRepository.findAllActive();
  }

  async getOne(rawId: string): Promise<Material> {
    return this.findActiveOrFail(rawId);
  }

  // ================== CREATE ==================

  async create(body: unknown): Promise<Material> {
    const input = parseMaterialCreate(body);
    await this.ensureNameIsFree(input.name);
    // Field by field on purpose (no mass assignment).
    return this.materialsRepository.create({
      name: input.name,
      description: input.description,
      status: input.status ?? "active",
    });
  }

  // ================== UPDATE ==================

  // PUT: full replacement; an omitted description is cleared.
  async update(rawId: string, body: unknown): Promise<Material> {
    const material = await this.findActiveOrFail(rawId);
    const input = parseMaterialUpdate(body);
    await this.ensureNameIsFree(input.name, material.id);
    return this.materialsRepository.update(material, input);
  }

  // PATCH: only the fields sent change.
  async patch(rawId: string, body: unknown): Promise<Material> {
    const material = await this.findActiveOrFail(rawId);
    const changes = parseMaterialPatch(body);
    if (changes.name !== undefined) {
      await this.ensureNameIsFree(changes.name, material.id);
    }
    return this.materialsRepository.update(material, changes);
  }

  // ================== DELETE ==================

  // Physical delete: also purges an inactive material, but never one with rate history.
  async delete(rawId: string): Promise<void> {
    const material = await this.materialsRepository.findById(parseId(rawId));
    if (!material) {
      throw new NotFoundError("Material no encontrado");
    }
    const rates = await this.materialRatesRepository.countByMaterial(material.id);
    if (rates > 0) {
      throw new ConflictError(
        `El material tiene ${rates} tarifa(s) registradas; desactívalo en lugar de eliminarlo`
      );
    }
    await this.materialsRepository.delete(material);
  }

  // Logical delete: status = inactive; the material leaves listings and new operations.
  async deactivate(rawId: string): Promise<Material> {
    const material = await this.findActiveOrFail(rawId);
    return this.materialsRepository.update(material, { status: "inactive" });
  }

  // ================== HELPERS ==================

  // Logical-delete policy: an inactive material is invisible to the API.
  async findActiveOrFail(rawId: string): Promise<Material> {
    const material = await this.materialsRepository.findById(parseId(rawId));
    if (!material || material.status !== "active") {
      throw new NotFoundError("Material no encontrado o inactivo");
    }
    return material;
  }

  private async ensureNameIsFree(name: string, ownId?: number): Promise<void> {
    const existing = await this.materialsRepository.findByName(name);
    if (existing && existing.id !== ownId) {
      throw new ConflictError(`Ya existe un material llamado ${name}`);
    }
  }
}
