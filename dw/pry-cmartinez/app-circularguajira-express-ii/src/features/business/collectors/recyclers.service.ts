import { RecyclersRepository } from "./recyclers.repository";
import { Recycler } from "./recycler.model";
import { ConflictError, NotFoundError } from "../../../shared/errors/httpError";
import { parseId } from "../../../shared/http/parseId";
import { parseRecyclerInput, parseRecyclerPatch } from "./dto/recycler.validation";

export class RecyclersService {
  constructor(private readonly recyclersRepository = new RecyclersRepository()) {}

  // ================== READ ==================

  getAll(): Promise<Recycler[]> {
    return this.recyclersRepository.findAllActive();
  }

  async getOne(rawId: string): Promise<Recycler> {
    const recycler = await this.recyclersRepository.findActiveById(parseId(rawId));
    if (!recycler) {
      throw new NotFoundError("Reciclador no encontrado o inactivo");
    }
    return recycler;
  }

  // ================== CREATE ==================

  async create(body: unknown): Promise<Recycler> {
    const input = parseRecyclerInput(body);
    await this.ensureDocumentIsFree(input.documentNumber);
    return this.recyclersRepository.create(input);
  }

  // ================== UPDATE ==================

  // PUT: full replacement; omitted optional fields are cleared.
  async update(rawId: string, body: unknown): Promise<Recycler> {
    const recycler = await this.findExisting(rawId);
    const input = parseRecyclerInput(body);
    await this.ensureDocumentIsFree(input.documentNumber, recycler.id);
    return this.recyclersRepository.update(recycler, input);
  }

  // PATCH: only the fields sent change.
  async patch(rawId: string, body: unknown): Promise<Recycler> {
    const recycler = await this.findExisting(rawId);
    const changes = parseRecyclerPatch(body);
    if (changes.documentNumber !== undefined) {
      await this.ensureDocumentIsFree(changes.documentNumber, recycler.id);
    }
    return this.recyclersRepository.update(recycler, changes);
  }

  // ================== DELETE ==================

  // Physical delete: the row is removed.
  async delete(rawId: string): Promise<void> {
    const recycler = await this.findExisting(rawId);
    await this.recyclersRepository.delete(recycler);
  }

  // Logical delete: the row stays but leaves the active listings.
  async deactivate(rawId: string): Promise<Recycler> {
    const recycler = await this.findExisting(rawId);
    return this.recyclersRepository.update(recycler, { status: "inactive" });
  }

  // ================== HELPERS ==================

  private async findExisting(rawId: string): Promise<Recycler> {
    const recycler = await this.recyclersRepository.findById(parseId(rawId));
    if (!recycler) {
      throw new NotFoundError("Reciclador no encontrado");
    }
    return recycler;
  }

  private async ensureDocumentIsFree(documentNumber: string, ownId?: number): Promise<void> {
    const existing = await this.recyclersRepository.findByDocumentNumber(documentNumber);
    if (existing && existing.id !== ownId) {
      throw new ConflictError(`Ya existe un reciclador con el documento ${documentNumber}`);
    }
  }
}
