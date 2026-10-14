import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../database/db";

export type RecyclerType = "independent" | "organization";
export type RecyclerStatus = "active" | "inactive";

export interface RecyclerAttributes {
  id: number;
  name: string;
  documentNumber: string;
  recyclerType: RecyclerType;
  phone: string;
  email: string | null;
  address: string | null;
  status: RecyclerStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export type RecyclerCreationAttributes = Optional<
  RecyclerAttributes,
  "id" | "email" | "address" | "status"
>;

export class Recycler
  extends Model<RecyclerAttributes, RecyclerCreationAttributes>
  implements RecyclerAttributes
{
  declare id: number;
  declare name: string;
  declare documentNumber: string;
  declare recyclerType: RecyclerType;
  declare phone: string;
  declare email: string | null;
  declare address: string | null;
  declare status: RecyclerStatus;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Recycler.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    // Citizen ID for independent recyclers, tax ID (NIT) for organizations.
    documentNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    recyclerType: {
      type: DataTypes.ENUM("independent", "organization"),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "inactive",
    },
  },
  {
    sequelize,
    tableName: "recyclers",
    modelName: "Recycler",
    underscored: true,
    timestamps: true,
  }
);
