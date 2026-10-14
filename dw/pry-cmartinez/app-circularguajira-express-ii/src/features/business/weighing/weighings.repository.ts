import { Transaction } from "sequelize";
import { Weighing, WeighingAttributes, WeighingCreationAttributes } from "./weighing.model";

export class WeighingsRepository {
  // ================== READ ==================

  findAllActive(): Promise<Weighing[]> {
    return Weighing.findAll({ where: { status: "active" }, order: [["id", "ASC"]] });
  }

  findById(id: number, transaction?: Transaction): Promise<Weighing | null> {
    return Weighing.findByPk(id, { transaction });
  }

  findByIdForUpdate(id: number, transaction: Transaction): Promise<Weighing | null> {
    return Weighing.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
  }

  findActiveByCollection(collectionId: number, transaction?: Transaction): Promise<Weighing[]> {
    return Weighing.findAll({
      where: { collectionId, status: "active" },
      order: [["id", "ASC"]],
      transaction,
      lock: transaction ? transaction.LOCK.UPDATE : undefined,
    });
  }

  // ================== CREATE ==================

  create(data: WeighingCreationAttributes, transaction: Transaction): Promise<Weighing> {
    return Weighing.create(data, { transaction });
  }

  // ================== UPDATE ==================

  update(
    weighing: Weighing,
    data: Partial<Omit<WeighingAttributes, "id" | "collectionId" | "materialId">>,
    transaction: Transaction
  ): Promise<Weighing> {
    return weighing.update(data, { transaction });
  }

  async deactivateByCollection(collectionId: number, transaction: Transaction): Promise<number> {
    const [affected] = await Weighing.update(
      { status: "inactive" },
      { where: { collectionId }, transaction }
    );
    return affected;
  }

  // ================== DELETE ==================

  delete(weighing: Weighing, transaction: Transaction): Promise<void> {
    return weighing.destroy({ transaction });
  }

  deleteByCollection(collectionId: number, transaction: Transaction): Promise<number> {
    return Weighing.destroy({ where: { collectionId }, transaction });
  }
}
