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
    },
    // STRING + isIn instead of ENUM: SQL Server maps ENUM to a CHECK constraint that sync({ alter: true }) cannot alter.
    status: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "active",
      validate: { isIn: [[...RECYCLER_STATUSES]] },
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
    // Named index instead of column-level `unique: true`: sync({ alter: true }) re-adds a column-level
    // UNIQUE on every run (duplicate indexes on MySQL, invalid ALTER COLUMN syntax on SQL Server).
    indexes: [{ name: "recyclers_document_number_unique", unique: true, fields: ["document_number"] }],
  }
);
