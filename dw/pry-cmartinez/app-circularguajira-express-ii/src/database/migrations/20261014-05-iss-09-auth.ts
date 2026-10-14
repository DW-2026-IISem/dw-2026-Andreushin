import { DataTypes } from "sequelize";
import type { Migration } from "../migrator";

// ISS-09: auth and RBAC tables (users, roles, resources, role_users, resource_roles, refresh_tokens).
const id = { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false };
const timestamps = {
  created_at: { type: DataTypes.DATE, allowNull: false },
  updated_at: { type: DataTypes.DATE, allowNull: false },
};
const status = (defaultValue: "active" | "inactive") => ({
  type: DataTypes.ENUM("active", "inactive"),
  allowNull: false,
  defaultValue,
});
const foreignKey = (table: string, onDelete: "RESTRICT" | "CASCADE") => ({
  type: DataTypes.INTEGER,
  allowNull: false,
  references: { model: table, key: "id" },
  onDelete,
  onUpdate: "CASCADE",
});

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable("users", {
    id,
    username: { type: DataTypes.STRING(80), allowNull: false },
    email: { type: DataTypes.STRING(150), allowNull: false },
    password: { type: DataTypes.STRING(255), allowNull: false },
    avatar: { type: DataTypes.STRING(500), allowNull: true },
    status: status("inactive"),
    ...timestamps,
  });
  await queryInterface.addIndex("users", ["username"], { unique: true, name: "uq_users_username" });
  await queryInterface.addIndex("users", ["email"], { unique: true, name: "uq_users_email" });

  await queryInterface.createTable("roles", {
    id,
    name: { type: DataTypes.STRING(80), allowNull: false },
    description: { type: DataTypes.STRING(255), allowNull: true },
    status: status("inactive"),
    ...timestamps,
  });
  await queryInterface.addIndex("roles", ["name"], { unique: true, name: "uq_roles_name" });

  await queryInterface.createTable("resources", {
    id,
    method: { type: DataTypes.STRING(10), allowNull: false },
    path: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.STRING(255), allowNull: true },
    status: status("inactive"),
    ...timestamps,
  });
  await queryInterface.addIndex("resources", ["method", "path"], { unique: true, name: "uq_resources_method_path" });

  // The permission matrix keeps its history: rows are deactivated, never cascaded away.
  await queryInterface.createTable("role_users", {
    id,
    user_id: foreignKey("users", "RESTRICT"),
    role_id: foreignKey("roles", "RESTRICT"),
    status: status("inactive"),
    ...timestamps,
  });
  await queryInterface.addIndex("role_users", ["user_id", "role_id"], { unique: true, name: "uq_role_users_user_role" });
  await queryInterface.addIndex("role_users", ["role_id"], { name: "ix_role_users_role_id" });

  await queryInterface.createTable("resource_roles", {
    id,
    role_id: foreignKey("roles", "RESTRICT"),
    resource_id: foreignKey("resources", "RESTRICT"),
    status: status("inactive"),
    ...timestamps,
  });
  await queryInterface.addIndex("resource_roles", ["role_id", "resource_id"], {
    unique: true,
    name: "uq_resource_roles_role_resource",
  });
  await queryInterface.addIndex("resource_roles", ["resource_id"], { name: "ix_resource_roles_resource_id" });

  // Sessions die with their user.
  await queryInterface.createTable("refresh_tokens", {
    id,
    user_id: foreignKey("users", "CASCADE"),
    token_hash: { type: DataTypes.STRING(255), allowNull: false },
    family_id: { type: DataTypes.STRING(100), allowNull: false },
    device_info: { type: DataTypes.STRING(500), allowNull: true },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    status: status("active"),
    ...timestamps,
  });
  await queryInterface.addIndex("refresh_tokens", ["token_hash"], { unique: true, name: "uq_refresh_tokens_token_hash" });
  await queryInterface.addIndex("refresh_tokens", ["family_id"], { name: "ix_refresh_tokens_family_id" });
  await queryInterface.addIndex("refresh_tokens", ["user_id"], { name: "ix_refresh_tokens_user_id" });
};

export const down: Migration = async ({ context: queryInterface }) => {
  for (const table of ["refresh_tokens", "resource_roles", "role_users", "resources", "roles", "users"]) {
    await queryInterface.dropTable(table);
  }
};
