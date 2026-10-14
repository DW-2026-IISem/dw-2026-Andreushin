import { DataTypes } from "sequelize";
import type { Migration } from "../migrator";

// ISS-06: materials catalog and rate history (materials feature).
export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable("materials", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
    name: { type: DataTypes.STRING(60), allowNull: false, unique: true },
    description: { type: DataTypes.STRING(255), allowNull: true },
    status: { type: DataTypes.ENUM("active", "inactive"), allowNull: false, defaultValue: "inactive" },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.createTable("material_rates", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
    material_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "materials", key: "id" },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },
    price_per_kg: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    valid_from: { type: DataTypes.DATEONLY, allowNull: false },
    valid_to: { type: DataTypes.DATEONLY, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.addIndex("material_rates", ["material_id", "valid_from"], {
    unique: true,
    name: "material_rates_material_id_valid_from",
  });
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.dropTable("material_rates");
  await queryInterface.dropTable("materials");
};
