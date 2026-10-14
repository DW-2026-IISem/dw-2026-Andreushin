import { DataTypes, Model } from "sequelize";

// DECIMAL column exposed as a number (MySQL returns DECIMAL as string).
export const decimalColumn = (attribute: string, precision: number, scale: number, defaultValue?: number) => ({
  type: DataTypes.DECIMAL(precision, scale),
  allowNull: false,
  ...(defaultValue === undefined ? {} : { defaultValue }),
  get(this: Model): number {
    return Number(this.getDataValue(attribute));
  },
});
