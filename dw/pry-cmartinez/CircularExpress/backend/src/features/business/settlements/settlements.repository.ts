import { CreationAttributes, InferAttributes, Op, Transaction, WhereOptions } from "sequelize";
import { Recycler } from "../recyclers/recycler.model";
import { Settlement, SettlementState } from "./settlement.model";

export type SettlementChanges = Partial<Omit<InferAttributes<Settlement>, "id" | "createdAt" | "updatedAt">>;
export interface SettlementFilters {
  recyclerId?: number;
  state?: SettlementState;
}

const withRecycler = { model: Recycler, as: "recycler", attributes: ["id", "name", "documentNumber"] };

// Data access only: the single layer that talks to Sequelize.
export class SettlementsRepository {
  findAllActive(filters: SettlementFilters = {}): Promise<Settlement[]> {
    const where: WhereOptions<Settlement> = {
      status: "active",
      ...(filters.recyclerId !== undefined && { recyclerId: filters.recyclerId }),
      ...(filters.state !== undefined && { state: filters.state }),
    };
    return Settlement.findAll({ where, include: [withRecycler], order: [["periodEnd", "DESC"], ["id", "DESC"]] });
  }

  findById(id: number, transaction?: Transaction): Promise<Settlement | null> {
    return Settlement.findByPk(id, { include: [withRecycler], transaction });
  }

  findByReferenceCode(referenceCode: string, excludeId?: number, transaction?: Transaction): Promise<Settlement | null> {
    return Settlement.findOne({
      where: { referenceCode, ...(excludeId !== undefined && { id: { [Op.ne]: excludeId } }) },
      transaction,
    });
  }

  // Another live (active, not rejected) settlement of the recycler whose period intersects [from, to].
  findOverlapping(recyclerId: number, from: string, to: string, excludeId?: number, transaction?: Transaction): Promise<Settlement | null> {
    return Settlement.findOne({
      where: {
        recyclerId,
        status: "active",
        state: { [Op.ne]: "rejected" },
        periodStart: { [Op.lte]: to },
        periodEnd: { [Op.gte]: from },
        ...(excludeId !== undefined && { id: { [Op.ne]: excludeId } }),
      },
      transaction,
    });
  }

  // Codes already used with this prefix, to generate the next sequence number.
  countByReferencePrefix(prefix: string, transaction?: Transaction): Promise<number> {
    return Settlement.count({ where: { referenceCode: { [Op.like]: `${prefix}%` } }, transaction });
  }

  count(transaction?: Transaction): Promise<number> {
    return Settlement.count({ transaction });
  }

  async create(data: CreationAttributes<Settlement>, transaction?: Transaction): Promise<Settlement> {
    const settlement = await Settlement.create(data, { transaction });
    return settlement.reload({ include: [withRecycler], transaction });
  }

  async update(settlement: Settlement, changes: SettlementChanges, transaction?: Transaction): Promise<Settlement> {
    await settlement.update(changes, { transaction });
    return settlement.reload({ include: [withRecycler], transaction });
  }

  async delete(settlement: Settlement, transaction?: Transaction): Promise<void> {
    await settlement.destroy({ transaction });
  }
}
