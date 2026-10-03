import { CreationAttributes, InferAttributes, Op, Transaction, WhereOptions } from "sequelize";
import { Collection } from "../collections/collection.model";
import { MaterialLot } from "../material-lots/material-lot.model";
import { Material } from "../materials/material.model";
import { Weighing } from "./weighing.model";

export type WeighingChanges = Partial<Omit<InferAttributes<Weighing>, "id" | "createdAt" | "updatedAt">>;
export interface WeighingFilters {
  collectionId?: number;
  materialId?: number;
  materialLotId?: number;
}

const withRelations = [
  { model: Collection, as: "collection", attributes: ["id", "name", "collectionDate"] },
  { model: Material, as: "material", attributes: ["id", "name"] },
  { model: MaterialLot, as: "materialLot", attributes: ["id", "name", "weightKg"] },
];

// Data access only: the single layer that talks to Sequelize.
export class WeighingsRepository {
  findAllActive(filters: WeighingFilters = {}): Promise<Weighing[]> {
    const where: WhereOptions<Weighing> = {
      status: "active",
      ...(filters.collectionId !== undefined && { collectionId: filters.collectionId }),
      ...(filters.materialId !== undefined && { materialId: filters.materialId }),
      ...(filters.materialLotId !== undefined && { materialLotId: filters.materialLotId }),
    };
    return Weighing.findAll({ where, include: withRelations, order: [["id", "DESC"]] });
  }

  findById(id: number, transaction?: Transaction): Promise<Weighing | null> {
    return Weighing.findByPk(id, { include: withRelations, transaction });
  }

  // Active weighings of the recycler's collections dated within [from, to] (used by settlements).
  findActiveForRecyclerInPeriod(recyclerId: number, from: string, to: string, transaction?: Transaction): Promise<Weighing[]> {
    return Weighing.findAll({
      where: { status: "active" },
      include: [
        {
          model: Collection,
          as: "collection",
          attributes: ["id", "name", "collectionDate"],
          where: { recyclerId, collectionDate: { [Op.between]: [from, to] } },
          required: true,
        },
        { model: Material, as: "material", attributes: ["id", "name"] },
      ],
      transaction,
    });
  }

  count(transaction?: Transaction): Promise<number> {
    return Weighing.count({ transaction });
  }

  async create(data: CreationAttributes<Weighing>, transaction?: Transaction): Promise<Weighing> {
    const weighing = await Weighing.create(data, { transaction });
    return weighing.reload({ include: withRelations, transaction });
  }

  async update(weighing: Weighing, changes: WeighingChanges, transaction?: Transaction): Promise<Weighing> {
    await weighing.update(changes, { transaction });
    return weighing.reload({ include: withRelations, transaction });
  }

  async delete(weighing: Weighing, transaction?: Transaction): Promise<void> {
    await weighing.destroy({ transaction });
  }
}
