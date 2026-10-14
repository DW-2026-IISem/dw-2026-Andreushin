import { Recycler } from "./recycler.model";
import { RecyclerInputDto, RecyclerPatchDto } from "./dto/recycler.dto";

export class RecyclersRepository {
  // ================== READ ==================

  findAllActive(): Promise<Recycler[]> {
    return Recycler.findAll({ where: { status: "active" }, order: [["id", "ASC"]] });
  }

  findActiveById(id: number): Promise<Recycler | null> {
    return Recycler.findOne({ where: { id, status: "active" } });
  }

  // Any status: updates may also reactivate an inactive recycler.
  findById(id: number): Promise<Recycler | null> {
    return Recycler.findByPk(id);
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

  update(recycler: Recycler, data: RecyclerPatchDto): Promise<Recycler> {
    return recycler.update(data);
  }

  // ================== DELETE ==================
}
