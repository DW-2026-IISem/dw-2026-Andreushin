import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";
import { getSequelize } from "../../database";

export class Comercio extends Model<InferAttributes<Comercio>, InferCreationAttributes<Comercio>> {
  declare id: CreationOptional<number>;
  declare nombre: string;
  declare descripcion: string | null;
  declare is_active: CreationOptional<boolean>;
  declare readonly created_at: CreationOptional<Date>;
  declare readonly updated_at: CreationOptional<Date>;
}

Comercio.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  {
    sequelize: getSequelize(),
    modelName: "Comercio",
    tableName: "comercios",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);
