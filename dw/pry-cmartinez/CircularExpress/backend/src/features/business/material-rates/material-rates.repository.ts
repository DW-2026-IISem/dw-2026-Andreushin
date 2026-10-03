import { CreationAttributes, InferAttributes, Op, Transaction, WhereOptions } from "sequelize";
import { Material } from "../materials/material.model";
import { MaterialRate } from "./material-rate.model";

export type MaterialRateChanges = Partial<Omit<InferAttributes<MaterialRate>, "id" | "createdAt" | "updatedAt">>;

const withMaterial = { model: Material, as: "material", attributes: ["id", "name"] };

// Data access only: the single layer that talks to Sequelize.
export class MaterialRatesRepository {
  findAllActive(materialId?: number): Promise<MaterialRate[]> {
    const where: WhereOptions<MaterialRate> = { status: "active", ...(materialId !== undefined && { materialId }) };
    return MaterialRate.findAll({ where, include: [withMaterial], order: [["materialId", "ASC"], ["validFrom", "DESC"]] });
  }

  findById(id: number, transaction?: Transaction): Promise<MaterialRate | null> {
    return MaterialRate.findByPk(id, { include: [withMaterial], transaction });
  }

  findByMaterialAndDate(
    materialId: number,
    validFrom: string,
    excludeId?: number,
    transaction?: Transaction
  ): Promise<MaterialRate | null> {
    return MaterialRate.findOne({
      where: { materialId, validFrom, ...(excludeId !== undefined && { id: { [Op.ne]: excludeId } }) },
      transaction,
    });
  }

  // Marks every other active rate of the material as inactive; returns how many were closed.
  async deactivateOthers(materialId: number, keepId: number, transaction?: Transaction): Promise<number> {
    const [affected] = await MaterialRate.update(
      { status: "inactive" },
      { where: { materialId, status: "active", id: { [Op.ne]: keepId } }, transaction }
    );
    return affected;
  }

  count(transaction?: Transaction): Promise<number> {
    return MaterialRate.count({ transaction });
  }

  async create(data: CreationAttributes<MaterialRate>, transaction?: Transaction): Promise<MaterialRate> {
    const rate = await MaterialRate.create(data, { transaction });
    return rate.reload({ include: [withMaterial], transaction });
  }

  bulkCreate(rows: CreationAttributes<MaterialRate>[], transaction?: Transaction): Promise<MaterialRate[]> {
    return MaterialRate.bulkCreate(rows, { transaction });
  }

  async update(rate: MaterialRate, changes: MaterialRateChanges, transaction?: Transaction): Promise<MaterialRate> {
    await rate.update(changes, { transaction });
    return rate.reload({ include: [withMaterial], transaction });
  }

  async delete(rate: MaterialRate, transaction?: Transaction): Promise<void> {
    await rate.destroy({ transaction });
  }
}
