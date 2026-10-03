import { CreationAttributes, InferAttributes, Op, Transaction } from "sequelize";
import { Recycler } from "./recycler.model";

export type RecyclerChanges = Partial<Omit<InferAttributes<Recycler>, "id" | "createdAt" | "updatedAt">>;

// Data access only: the single layer that talks to Sequelize.
export class RecyclersRepository {
  findAllActive(): Promise<Recycler[]> {
    return Recycler.findAll({ where: { status: "active" }, order: [["id", "ASC"]] });
  }

  findById(id: number, transaction?: Transaction): Promise<Recycler | null> {
    return Recycler.findByPk(id, { transaction });
  }

  findByDocumentNumber(documentNumber: string, excludeId?: number, transaction?: Transaction): Promise<Recycler | null> {
    return Recycler.findOne({
      where: {
        documentNumber,
        ...(excludeId !== undefined && { id: { [Op.ne]: excludeId } }),
      },
      transaction,
    });
  }

  create(data: CreationAttributes<Recycler>, transaction?: Transaction): Promise<Recycler> {
    return Recycler.create(data, { transaction });
  }

  update(recycler: Recycler, changes: RecyclerChanges, transaction?: Transaction): Promise<Recycler> {
    return recycler.update(changes, { transaction });
  }

  async delete(recycler: Recycler, transaction?: Transaction): Promise<void> {
    await recycler.destroy({ transaction });
  }
}
