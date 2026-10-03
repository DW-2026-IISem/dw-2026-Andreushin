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
import { Material } from "../materials/material.model";

export const MATERIAL_RATE_STATUSES = ["active", "inactive"] as const;
export type MaterialRateStatus = (typeof MATERIAL_RATE_STATUSES)[number];

// Price per kilo of a material from `validFrom` on; the single "active" rate of a material is the current one.
export class MaterialRate extends Model<InferAttributes<MaterialRate>, InferCreationAttributes<MaterialRate>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare description: CreationOptional<string | null>;
  declare pricePerKg: number;
  declare validFrom: string; // DATEONLY, "YYYY-MM-DD"
  declare materialId: ForeignKey<Material["id"]>;
  declare status: CreationOptional<MaterialRateStatus>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Filled when the query includes the "material" association.
  declare material?: NonAttribute<Material>;
}

MaterialRate.init(
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
    pricePerKg: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      // MySQL and PostgreSQL return DECIMAL as a string; always expose a number.
      get() {
        const value = this.getDataValue("pricePerKg") as unknown;
        return value === null || value === undefined ? value : Number(value);
      },
    },
    validFrom: {
      type: DataTypes.DATEONLY,
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
      validate: { isIn: [[...MATERIAL_RATE_STATUSES]] },
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "MaterialRate",
    tableName: "material_rates",
    timestamps: true,
    underscored: true,
    // One rate per material and start date.
    indexes: [{ name: "material_rates_material_valid_from_unique", unique: true, fields: ["material_id", "valid_from"] }],
  }
);
