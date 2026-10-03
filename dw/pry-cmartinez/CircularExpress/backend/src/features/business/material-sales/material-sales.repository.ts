import { CreationAttributes, InferAttributes, Transaction, WhereOptions } from "sequelize";
import { MaterialLot } from "../material-lots/material-lot.model";
import { Material } from "../materials/material.model";
import { MaterialSale } from "./material-sale.model";

export type MaterialSaleChanges = Partial<Omit<InferAttributes<MaterialSale>, "id" | "createdAt" | "updatedAt">>;

const withLot = {
  model: MaterialLot,
  as: "materialLot",
  attributes: ["id", "name", "weightKg"],
  include: [{ model: Material, as: "material", attributes: ["id", "name"] }],
};

// Data access only: the single layer that talks to Sequelize.
export class MaterialSalesRepository {
  findAllActive(materialLotId?: number): Promise<MaterialSale[]> {
    const where: WhereOptions<MaterialSale> = { status: "active", ...(materialLotId !== undefined && { materialLotId }) };
    return MaterialSale.findAll({ where, include: [withLot], order: [["saleDate", "DESC"], ["id", "DESC"]] });
  }

  findById(id: number, transaction?: Transaction): Promise<MaterialSale | null> {
    return MaterialSale.findByPk(id, { include: [withLot], transaction });
  }

  count(transaction?: Transaction): Promise<number> {
    return MaterialSale.count({ transaction });
  }

  async create(data: CreationAttributes<MaterialSale>, transaction?: Transaction): Promise<MaterialSale> {
    const sale = await MaterialSale.create(data, { transaction });
    return sale.reload({ include: [withLot], transaction });
  }

  async update(sale: MaterialSale, changes: MaterialSaleChanges, transaction?: Transaction): Promise<MaterialSale> {
    await sale.update(changes, { transaction });
    return sale.reload({ include: [withLot], transaction });
  }

  async delete(sale: MaterialSale, transaction?: Transaction): Promise<void> {
    await sale.destroy({ transaction });
  }
}
