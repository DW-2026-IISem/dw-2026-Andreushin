import { Transaction } from "sequelize";
import { Collection, CollectionAttributes, CollectionCreationAttributes } from "./collection.model";
import { Weighing } from "./weighing.model";

// Reads include only the active weighings, in insertion order.
const activeWeighings = {
  model: Weighing,
  as: "weighings",
  where: { status: "active" },
  required: false,
};

export class CollectionsRepository {
  // ================== READ ==================

  findAllActiveWithWeighings(): Promise<Collection[]> {
    return Collection.findAll({
      where: { status: "active" },
      include: [activeWeighings],
      order: [
        ["collectedOn", "DESC"],
        ["id", "DESC"],
        [{ model: Weighing, as: "weighings" }, "id", "ASC"],
      ],
    });
  }

  findByIdWithWeighings(id: number, transaction?: Transaction): Promise<Collection | null> {
    return Collection.findByPk(id, {
      include: [activeWeighings],
      order: [[{ model: Weighing, as: "weighings" }, "id", "ASC"]],
      transaction,
    });
  }

  // SELECT ... FOR UPDATE: first lock of every write (collections -> weighings -> settlements).
  findByIdForUpdate(id: number, transaction: Transaction): Promise<Collection | null> {
    return Collection.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
  }

  // ================== CREATE ==================

  create(data: CollectionCreationAttributes, transaction: Transaction): Promise<Collection> {
    return Collection.create(data, { transaction });
  }

  // ================== UPDATE ==================

  update(
    collection: Collection,
    data: Partial<Omit<CollectionAttributes, "id">>,
    transaction: Transaction
  ): Promise<Collection> {
    return collection.update(data, { transaction });
  }

  // ================== DELETE ==================

  delete(collection: Collection, transaction: Transaction): Promise<void> {
    return collection.destroy({ transaction });
  }
}
