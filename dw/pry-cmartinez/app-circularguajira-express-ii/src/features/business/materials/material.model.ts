import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../database/db";

export type MaterialStatus = "active" | "inactive";

export interface MaterialAttributes {
  id: number;
  name: string;
  description: string | null;
  status: MaterialStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export type MaterialCreationAttributes = Optional<MaterialAttributes, "id" | "description" | "status">;

export class Material
  extends Model<MaterialAttributes, MaterialCreationAttributes>
  implements MaterialAttributes
{
  declare id: number;
  declare name: string;
  declare description: string | null;
  declare status: MaterialStatus;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Material.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    // Catalog name used at the scale (PET, Cartón, Aluminio...).
    name: {
      type: DataTypes.STRING(60),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: false,
      // Fail-safe: a row inserted without explicit status stays hidden; the API sends "active".
      defaultValue: "inactive",
    },
  },
  {
    sequelize,
    tableName: "materials",
    modelName: "Material",
    underscored: true,
    timestamps: true,
  }
);
