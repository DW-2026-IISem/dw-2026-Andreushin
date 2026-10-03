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
import { Recycler } from "../recyclers/recycler.model";

export const SETTLEMENT_STATES = ["pending", "approved", "paid", "rejected"] as const;
export type SettlementState = (typeof SETTLEMENT_STATES)[number];

export const SETTLEMENT_STATUSES = ["active", "inactive"] as const;
export type SettlementStatus = (typeof SETTLEMENT_STATUSES)[number];

// Payment to a recycler for a period: totals are computed from the period's weighings and the rate valid
// on each collection date. `state` is the approval workflow; `status` is the usual logical delete.
export class Settlement extends Model<InferAttributes<Settlement>, InferCreationAttributes<Settlement>> {
  declare id: CreationOptional<number>;
  declare referenceCode: string;
  declare settlementDate: string; // DATEONLY
  declare periodStart: string; // DATEONLY
  declare periodEnd: string; // DATEONLY
  declare totalWeightKg: number;
  declare weighingsCount: number;
  declare amount: number;
  declare state: CreationOptional<SettlementState>;
  declare observations: CreationOptional<string | null>;
  declare recyclerId: ForeignKey<Recycler["id"]>;
  declare status: CreationOptional<SettlementStatus>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Filled when the query includes the association.
  declare recycler?: NonAttribute<Recycler>;
}

const decimal = (field: "totalWeightKg" | "amount") => ({
  type: DataTypes.DECIMAL(12, 2),
  allowNull: false,
  get(this: Settlement) {
    return decimalToNumber(this.getDataValue(field));
  },
});

Settlement.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    referenceCode: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },
    settlementDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    periodStart: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    periodEnd: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    totalWeightKg: decimal("totalWeightKg"),
    weighingsCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    amount: decimal("amount"),
    state: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "pending",
      validate: { isIn: [[...SETTLEMENT_STATES]] },
    },
    observations: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    recyclerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "active",
      validate: { isIn: [[...SETTLEMENT_STATUSES]] },
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "Settlement",
    tableName: "settlements",
    timestamps: true,
    underscored: true,
    indexes: [{ name: "settlements_reference_code_unique", unique: true, fields: ["reference_code"] }],
  }
);
