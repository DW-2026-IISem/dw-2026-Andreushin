import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import { sequelize } from "../../../database/db";

export const PLANT_STATUSES = ["active", "inactive"] as const;
export type PlantStatus = (typeof PLANT_STATUSES)[number];

// Physical facility that receives, sorts and processes recyclables.
export class Plant extends Model<InferAttributes<Plant>, InferCreationAttributes<Plant>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare municipality: string;
  declare address: CreationOptional<string | null>;
  declare description: CreationOptional<string | null>;
  declare status: CreationOptional<PlantStatus>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Plant.init(
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
    municipality: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "active",
      validate: { isIn: [[...PLANT_STATUSES]] },
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "Plant",
    tableName: "plants",
    timestamps: true,
    underscored: true,
    indexes: [{ name: "plants_name_unique", unique: true, fields: ["name"] }],
  }
);
