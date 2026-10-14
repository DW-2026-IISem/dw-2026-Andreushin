import { RecyclersRepository } from "./recyclers.repository";
import { Recycler } from "./recycler.model";
import { ConflictError, NotFoundError } from "../../../shared/errors/httpError";
import { parseId } from "../../../shared/http/parseId";
import { parseRecyclerInput } from "./dto/recycler.validation";

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

  // ================== DELETE ==================

  // ================== HELPERS ==================

  private async ensureDocumentIsFree(documentNumber: string, ownId?: number): Promise<void> {
    const existing = await this.recyclersRepository.findByDocumentNumber(documentNumber);
    if (existing && existing.id !== ownId) {
      throw new ConflictError(`Ya existe un reciclador con el documento ${documentNumber}`);
    }
  }
}
