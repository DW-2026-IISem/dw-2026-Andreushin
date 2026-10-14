import { DataTypes } from "sequelize";
import type { Migration } from "../migrator";

// ISS-07: collection routes and their collection points (routes feature).
export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable("routes", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
    name: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    municipality: { type: DataTypes.STRING(60), allowNull: false },
    description: { type: DataTypes.STRING(255), allowNull: true },
    status: { type: DataTypes.ENUM("active", "inactive"), allowNull: false, defaultValue: "inactive" },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.createTable("collection_points", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
    route_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "routes", key: "id" },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },
    name: { type: DataTypes.STRING(100), allowNull: false },
    address: { type: DataTypes.STRING(200), allowNull: false },
    visit_order: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.ENUM("active", "inactive"), allowNull: false, defaultValue: "inactive" },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.addIndex("collection_points", ["route_id", "visit_order"], {
    unique: true,
    name: "collection_points_route_id_visit_order",
  });
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.dropTable("collection_points");
  await queryInterface.dropTable("routes");
};
