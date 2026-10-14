import { Recycler } from "./recycler.model";

export class RecyclersRepository {
  // ================== READ ==================

  findAllActive(): Promise<Recycler[]> {
    return Recycler.findAll({ where: { status: "active" }, order: [["id", "ASC"]] });
  }

  findActiveById(id: number): Promise<Recycler | null> {
    return Recycler.findOne({ where: { id, status: "active" } });
  }

  // ================== CREATE ==================

  // ================== UPDATE ==================

  // ================== DELETE ==================
}
