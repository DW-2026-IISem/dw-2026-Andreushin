import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import { sequelize } from "../../../database/db";

export const RECYCLER_STATUSES = ["active", "inactive"] as const;
export type RecyclerStatus = (typeof RECYCLER_STATUSES)[number];

export class Recycler extends Model<InferAttributes<Recycler>, InferCreationAttributes<Recycler>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare description: CreationOptional<string | null>;
  declare phone: CreationOptional<string | null>;
  declare email: CreationOptional<string | null>;
  declare documentNumber: CreationOptional<string | null>;
  declare status: CreationOptional<RecyclerStatus>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Recycler.init(
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
    phone: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    documentNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM(...RECYCLER_STATUSES),
      allowNull: false,
      defaultValue: "active",
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "Recycler",
    tableName: "recyclers",
    timestamps: true,
    underscored: true,
  }
);
