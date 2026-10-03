import { CreationAttributes, InferAttributes, Op, Transaction } from "sequelize";
import { Material } from "./material.model";

export type MaterialChanges = Partial<Omit<InferAttributes<Material>, "id" | "createdAt" | "updatedAt">>;

// Data access only: the single layer that talks to Sequelize.
export class MaterialsRepository {
  findAllActive(): Promise<Material[]> {
    return Material.findAll({ where: { status: "active" }, order: [["name", "ASC"]] });
  }

  findById(id: number, transaction?: Transaction): Promise<Material | null> {
    return Material.findByPk(id, { transaction });
  }

  findByName(name: string, excludeId?: number, transaction?: Transaction): Promise<Material | null> {
    return Material.findOne({
      where: { name, ...(excludeId !== undefined && { id: { [Op.ne]: excludeId } }) },
      transaction,
    });
  }

  count(transaction?: Transaction): Promise<number> {
    return Material.count({ transaction });
  }

  create(data: CreationAttributes<Material>, transaction?: Transaction): Promise<Material> {
    return Material.create(data, { transaction });
  }

  bulkCreate(rows: CreationAttributes<Material>[], transaction?: Transaction): Promise<Material[]> {
    return Material.bulkCreate(rows, { transaction });
  }

  update(material: Material, changes: MaterialChanges, transaction?: Transaction): Promise<Material> {
    return material.update(changes, { transaction });
  }

  async delete(material: Material, transaction?: Transaction): Promise<void> {
    await material.destroy({ transaction });
  }
}
