import { DataTypes } from "sequelize";
import type { Migration } from "../migrator";

// ISS-03: recyclers (collectors feature).
export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable("recyclers", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
    name: { type: DataTypes.STRING(120), allowNull: false },
    document_number: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    recycler_type: { type: DataTypes.ENUM("independent", "organization"), allowNull: false },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    email: { type: DataTypes.STRING(120), allowNull: true },
    address: { type: DataTypes.STRING(200), allowNull: true },
    status: { type: DataTypes.ENUM("active", "inactive"), allowNull: false, defaultValue: "inactive" },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.dropTable("recyclers");
};
