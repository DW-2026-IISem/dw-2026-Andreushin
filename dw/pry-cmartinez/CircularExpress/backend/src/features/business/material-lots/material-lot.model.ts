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
import { Material } from "../materials/material.model";
import { Plant } from "../plants/plant.model";

export const MATERIAL_LOT_STATUSES = ["active", "inactive"] as const;
export type MaterialLotStatus = (typeof MATERIAL_LOT_STATUSES)[number];

// Inventory of one material stored at one plant; weightKg is the current stock
// (raised by weighings and lowered by sales, never edited by hand).
export class MaterialLot extends Model<InferAttributes<MaterialLot>, InferCreationAttributes<MaterialLot>> {
  declare id: CreationOptional<number>;
  declare name: string; // lot code
  declare description: CreationOptional<string | null>;
  declare weightKg: CreationOptional<number>;
  declare plantId: ForeignKey<Plant["id"]>;
  declare materialId: ForeignKey<Material["id"]>;
  declare status: CreationOptional<MaterialLotStatus>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Filled when the query includes the associations.
  declare plant?: NonAttribute<Plant>;
  declare material?: NonAttribute<Material>;
}

MaterialLot.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(60),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    weightKg: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      get() {
        return decimalToNumber(this.getDataValue("weightKg"));
      },
    },
    plantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    materialId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "active",
      validate: { isIn: [[...MATERIAL_LOT_STATUSES]] },
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "MaterialLot",
    tableName: "material_lots",
    timestamps: true,
    underscored: true,
    indexes: [{ name: "material_lots_name_unique", unique: true, fields: ["name"] }],
  }
);
