import { Recycler } from "./recycler.model";
import { RecyclerInputDto } from "./dto/recycler.dto";

export class RecyclersRepository {
  // ================== READ ==================

  findAllActive(): Promise<Recycler[]> {
    return Recycler.findAll({ where: { status: "active" }, order: [["id", "ASC"]] });
  }

  findActiveById(id: number): Promise<Recycler | null> {
    return Recycler.findOne({ where: { id, status: "active" } });
  }

  // Any status: document numbers stay unique even for inactive recyclers.
  findByDocumentNumber(documentNumber: string): Promise<Recycler | null> {
    return Recycler.findOne({ where: { documentNumber } });
  }

  // ================== CREATE ==================

  create(data: RecyclerInputDto): Promise<Recycler> {
    return Recycler.create(data);
  }

  // ================== UPDATE ==================

  // ================== DELETE ==================
}
