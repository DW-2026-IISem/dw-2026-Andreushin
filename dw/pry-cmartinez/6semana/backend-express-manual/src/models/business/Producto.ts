import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";
import { getSequelize } from "../../database";

export class Producto extends Model<InferAttributes<Producto>, InferCreationAttributes<Producto>> {
  declare id: CreationOptional<number>;
  declare comercio_id: number;
  declare sku: string;
  declare nombre: string;
  declare descripcion: string | null;
  declare precio: number;
  declare is_active: CreationOptional<boolean>;
  declare readonly created_at: CreationOptional<Date>;
  declare readonly updated_at: CreationOptional<Date>;
}

Producto.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    comercio_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sku: {
      type: DataTypes.STRING(40),
      allowNull: false,
      unique: true,
    },
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    precio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
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
    modelName: "Producto",
    tableName: "productos",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);
