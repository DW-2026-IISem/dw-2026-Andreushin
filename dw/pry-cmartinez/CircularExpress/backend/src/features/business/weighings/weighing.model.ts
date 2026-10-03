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
import { Collection } from "../collections/collection.model";
import { MaterialLot } from "../material-lots/material-lot.model";
import { Material } from "../materials/material.model";

export const WEIGHING_STATUSES = ["active", "inactive"] as const;
export type WeighingStatus = (typeof WEIGHING_STATUSES)[number];

// Scale reading of one material during a collection workday. netWeightKg = gross - tare (server-computed);
// an active weighing with a lot adds its net weight to that lot's stock.
export class Weighing extends Model<InferAttributes<Weighing>, InferCreationAttributes<Weighing>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare description: CreationOptional<string | null>;
  declare grossWeightKg: number;
  declare tareWeightKg: CreationOptional<number>;
  declare netWeightKg: number;
  declare collectionId: ForeignKey<Collection["id"]>;
  declare materialId: ForeignKey<Material["id"]>;
  declare materialLotId: ForeignKey<MaterialLot["id"]> | null;
  declare status: CreationOptional<WeighingStatus>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Filled when the query includes the associations.
  declare collection?: NonAttribute<Collection>;
  declare material?: NonAttribute<Material>;
  declare materialLot?: NonAttribute<MaterialLot> | null;
}

const decimalKg = (field: "grossWeightKg" | "tareWeightKg" | "netWeightKg", allowNull = false) => ({
  type: DataTypes.DECIMAL(10, 2),
  allowNull,
  get(this: Weighing) {
    return decimalToNumber(this.getDataValue(field));
  },
});

Weighing.init(
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
    grossWeightKg: decimalKg("grossWeightKg"),
    tareWeightKg: { ...decimalKg("tareWeightKg"), defaultValue: 0 },
    netWeightKg: decimalKg("netWeightKg"),
    collectionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    materialId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    materialLotId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "active",
      validate: { isIn: [[...WEIGHING_STATUSES]] },
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "Weighing",
    tableName: "weighings",
    timestamps: true,
    underscored: true,
  }
);
