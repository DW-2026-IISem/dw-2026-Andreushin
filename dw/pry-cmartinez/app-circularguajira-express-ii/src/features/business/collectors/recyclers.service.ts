import { RecyclersRepository } from "./recyclers.repository";
import { Recycler } from "./recycler.model";
import { NotFoundError } from "../../../shared/errors/httpError";
import { parseId } from "../../../shared/http/parseId";

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

  // ================== UPDATE ==================

  // ================== DELETE ==================
}
