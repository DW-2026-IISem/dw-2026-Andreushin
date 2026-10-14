import { DataTypes } from "sequelize";
import type { Migration } from "../migrator";

// ISS-08: collections, weighings and settlements (weighing + settlements features).
const foreignKey = (table: string) => ({
  type: DataTypes.INTEGER,
  allowNull: false,
  references: { model: table, key: "id" },
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable("collections", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
    recycler_id: foreignKey("recyclers"),
    route_id: foreignKey("routes"),
    collected_on: { type: DataTypes.DATEONLY, allowNull: false },
    total_net_kg: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    total_amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    status: { type: DataTypes.ENUM("active", "inactive"), allowNull: false, defaultValue: "inactive" },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.createTable("weighings", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
    collection_id: foreignKey("collections"),
    material_id: foreignKey("materials"),
    rate_id: foreignKey("material_rates"),
    price_per_kg: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    gross_kg: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    tare_kg: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    net_kg: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
    status: { type: DataTypes.ENUM("active", "inactive"), allowNull: false, defaultValue: "inactive" },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.createTable("settlements", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
    collection_id: foreignKey("collections"),
    recycler_id: foreignKey("recyclers"),
    settled_at: { type: DataTypes.DATE, allowNull: false },
    total_net_kg: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    total_amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
    line_count: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.ENUM("issued", "voided"), allowNull: false },
    notes: { type: DataTypes.STRING(255), allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.dropTable("settlements");
  await queryInterface.dropTable("weighings");
  await queryInterface.dropTable("collections");
};
