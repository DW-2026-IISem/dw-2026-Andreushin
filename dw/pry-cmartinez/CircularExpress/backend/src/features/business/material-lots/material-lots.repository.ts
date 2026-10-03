import { CreationAttributes, InferAttributes, Op, Transaction, WhereOptions } from "sequelize";
import { Material } from "../materials/material.model";
import { Plant } from "../plants/plant.model";
import { MaterialLot } from "./material-lot.model";

export type MaterialLotChanges = Partial<Omit<InferAttributes<MaterialLot>, "id" | "createdAt" | "updatedAt">>;
export interface MaterialLotFilters {
  plantId?: number;
  materialId?: number;
}

const withRelations = [
  { model: Plant, as: "plant", attributes: ["id", "name", "municipality"] },
  { model: Material, as: "material", attributes: ["id", "name"] },
];

// Data access only: the single layer that talks to Sequelize.
export class MaterialLotsRepository {
  findAllActive(filters: MaterialLotFilters = {}): Promise<MaterialLot[]> {
    const where: WhereOptions<MaterialLot> = {
      status: "active",
      ...(filters.plantId !== undefined && { plantId: filters.plantId }),
      ...(filters.materialId !== undefined && { materialId: filters.materialId }),
    };
    return MaterialLot.findAll({ where, include: withRelations, order: [["plantId", "ASC"], ["name", "ASC"]] });
  }

  findById(id: number, transaction?: Transaction): Promise<MaterialLot | null> {
    return MaterialLot.findByPk(id, { include: withRelations, transaction });
  }

  findByName(name: string, excludeId?: number, transaction?: Transaction): Promise<MaterialLot | null> {
    return MaterialLot.findOne({
      where: { name, ...(excludeId !== undefined && { id: { [Op.ne]: excludeId } }) },
      transaction,
    });
  }

  count(transaction?: Transaction): Promise<number> {
    return MaterialLot.count({ transaction });
  }

  async create(data: CreationAttributes<MaterialLot>, transaction?: Transaction): Promise<MaterialLot> {
    const lot = await MaterialLot.create(data, { transaction });
    return lot.reload({ include: withRelations, transaction });
  }

  bulkCreate(rows: CreationAttributes<MaterialLot>[], transaction?: Transaction): Promise<MaterialLot[]> {
    return MaterialLot.bulkCreate(rows, { transaction });
  }

  async update(lot: MaterialLot, changes: MaterialLotChanges, transaction?: Transaction): Promise<MaterialLot> {
    await lot.update(changes, { transaction });
    return lot.reload({ include: withRelations, transaction });
  }

  async delete(lot: MaterialLot, transaction?: Transaction): Promise<void> {
    await lot.destroy({ transaction });
  }
}
