import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import { sequelize } from "../../../database/db";

export const MATERIAL_STATUSES = ["active", "inactive"] as const;
export type MaterialStatus = (typeof MATERIAL_STATUSES)[number];

export class Material extends Model<InferAttributes<Material>, InferCreationAttributes<Material>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare description: CreationOptional<string | null>;
  declare status: CreationOptional<MaterialStatus>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Material.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "active",
      validate: { isIn: [[...MATERIAL_STATUSES]] },
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "Material",
    tableName: "materials",
    timestamps: true,
    underscored: true,
    indexes: [{ name: "materials_name_unique", unique: true, fields: ["name"] }],
  }
);
