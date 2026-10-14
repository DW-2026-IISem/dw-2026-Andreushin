import { Transaction } from "sequelize";
import { Settlement, SettlementCreationAttributes } from "./settlement.model";
import { Collection } from "../weighing/collection.model";
import { Weighing } from "../weighing/weighing.model";

// A settlement is read with its collection and the weighings it paid.
const withDetail = [
  {
    model: Collection,
    as: "collection",
    include: [{ model: Weighing, as: "weighings", where: { status: "active" }, required: false }],
  },
];

export class SettlementsRepository {
  // ================== READ ==================

  findAllIssued(): Promise<Settlement[]> {
    return Settlement.findAll({ where: { status: "issued" }, order: [["id", "DESC"]] });
  }

  findById(id: number, transaction?: Transaction): Promise<Settlement | null> {
    return Settlement.findByPk(id, { transaction });
  }

  findByIdWithDetail(id: number): Promise<Settlement | null> {
    return Settlement.findByPk(id, {
      include: withDetail,
      order: [[{ model: Collection, as: "collection" }, { model: Weighing, as: "weighings" }, "id", "ASC"]],
    });
  }

  // The issued settlement of a collection, if any (it locks the collection).
  findIssuedByCollection(collectionId: number, transaction?: Transaction): Promise<Settlement | null> {
    return Settlement.findOne({ where: { collectionId, status: "issued" }, transaction });
  }

  countByCollection(collectionId: number, transaction?: Transaction): Promise<number> {
    return Settlement.count({ where: { collectionId }, transaction });
  }

  // ================== CREATE ==================

  create(data: SettlementCreationAttributes, transaction: Transaction): Promise<Settlement> {
    return Settlement.create(data, { transaction });
  }

  // ================== UPDATE ==================

  update(
    settlement: Settlement,
    data: { notes: string | null } | { status: "voided" },
    transaction?: Transaction
  ): Promise<Settlement> {
    return settlement.update(data, { transaction });
  }

  // ================== DELETE ==================

  delete(settlement: Settlement): Promise<void> {
    return settlement.destroy();
  }
}
