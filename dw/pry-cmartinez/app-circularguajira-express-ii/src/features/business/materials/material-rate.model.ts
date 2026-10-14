import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../database/db";

export interface MaterialRateAttributes {
  id: number;
  materialId: number;
  // Price paid to the recycler per net kilogram, in COP.
  pricePerKg: number;
  // Validity period as YYYY-MM-DD; validTo null = open-ended (current rate).
  validFrom: string;
  validTo: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type MaterialRateCreationAttributes = Optional<MaterialRateAttributes, "id" | "validTo">;

export class MaterialRate
  extends Model<MaterialRateAttributes, MaterialRateCreationAttributes>
  implements MaterialRateAttributes
{
  declare id: number;
  declare materialId: number;
  declare pricePerKg: number;
  declare validFrom: string;
  declare validTo: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

MaterialRate.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    materialId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "materials", key: "id" },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },
    pricePerKg: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      // MySQL returns DECIMAL as string; the API exposes a number.
      get(this: MaterialRate): number {
        return Number(this.getDataValue("pricePerKg"));
      },
    },
    validFrom: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    validTo: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "material_rates",
    modelName: "MaterialRate",
    underscored: true,
    timestamps: true,
    indexes: [{ unique: true, fields: ["material_id", "valid_from"] }],
  }
);
