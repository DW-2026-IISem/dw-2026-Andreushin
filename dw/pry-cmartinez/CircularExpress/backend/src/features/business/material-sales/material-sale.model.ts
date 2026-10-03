import {
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
} from "sequelize";
import { sequelize } from "../../../database/db";
import { decimalToNumber } from "../../../shared/database/decimal";
import { MaterialLot } from "../material-lots/material-lot.model";

export const MATERIAL_SALE_STATUSES = ["active", "inactive"] as const;
export type MaterialSaleStatus = (typeof MATERIAL_SALE_STATUSES)[number];

// Sale of part of a lot to a processor. totalAmount = quantityKg × unitPricePerKg (server-computed);
// an active sale removes quantityKg from the lot's stock.
export class MaterialSale extends Model<InferAttributes<MaterialSale>, InferCreationAttributes<MaterialSale>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare description: CreationOptional<string | null>;
  declare buyerName: string;
  declare saleDate: string; // DATEONLY, "YYYY-MM-DD"
  declare quantityKg: number;
  declare unitPricePerKg: number;
  declare totalAmount: number;
  declare materialLotId: ForeignKey<MaterialLot["id"]>;
  declare status: CreationOptional<MaterialSaleStatus>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Filled when the query includes the association.
  declare materialLot?: NonAttribute<MaterialLot>;
}

const decimal = (field: "quantityKg" | "unitPricePerKg" | "totalAmount", precision: number) => ({
  type: DataTypes.DECIMAL(precision, 2),
  allowNull: false,
  get(this: MaterialSale) {
    return decimalToNumber(this.getDataValue(field));
  },
});

MaterialSale.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    buyerName: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    saleDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    quantityKg: decimal("quantityKg", 10),
    unitPricePerKg: decimal("unitPricePerKg", 10),
    totalAmount: decimal("totalAmount", 12),
    materialLotId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "active",
      validate: { isIn: [[...MATERIAL_SALE_STATUSES]] },
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "MaterialSale",
    tableName: "material_sales",
    timestamps: true,
    underscored: true,
  }
);
