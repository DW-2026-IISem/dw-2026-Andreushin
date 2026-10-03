import { CreationAttributes, InferAttributes, Op, Transaction, WhereOptions } from "sequelize";
import { Plant } from "./plant.model";

export type PlantChanges = Partial<Omit<InferAttributes<Plant>, "id" | "createdAt" | "updatedAt">>;

// Data access only: the single layer that talks to Sequelize.
export class PlantsRepository {
  findAllActive(municipality?: string): Promise<Plant[]> {
    const where: WhereOptions<Plant> = { status: "active", ...(municipality !== undefined && { municipality }) };
    return Plant.findAll({ where, order: [["municipality", "ASC"], ["name", "ASC"]] });
  }

  findById(id: number, transaction?: Transaction): Promise<Plant | null> {
    return Plant.findByPk(id, { transaction });
  }

  findByName(name: string, excludeId?: number, transaction?: Transaction): Promise<Plant | null> {
    return Plant.findOne({
      where: { name, ...(excludeId !== undefined && { id: { [Op.ne]: excludeId } }) },
      transaction,
    });
  }

  count(transaction?: Transaction): Promise<number> {
    return Plant.count({ transaction });
  }

  create(data: CreationAttributes<Plant>, transaction?: Transaction): Promise<Plant> {
    return Plant.create(data, { transaction });
  }

  bulkCreate(rows: CreationAttributes<Plant>[], transaction?: Transaction): Promise<Plant[]> {
    return Plant.bulkCreate(rows, { transaction });
  }

  update(plant: Plant, changes: PlantChanges, transaction?: Transaction): Promise<Plant> {
    return plant.update(changes, { transaction });
  }

  async delete(plant: Plant, transaction?: Transaction): Promise<void> {
    await plant.destroy({ transaction });
  }
}
