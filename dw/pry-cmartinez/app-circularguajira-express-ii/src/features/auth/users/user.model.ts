import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../database/db";
import { hashPassword } from "../../../shared/auth/password";

export type UserStatus = "active" | "inactive";

export interface UserAttributes {
  id: number;
  username: string;
  email: string;
  // Always a bcrypt hash: the hooks below hash every write.
  password: string;
  avatar: string | null;
  status: UserStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserCreationAttributes = Optional<UserAttributes, "id" | "avatar" | "status">;
export type PublicUser = Omit<UserAttributes, "password">;

// User (users): staff identity (scale, plant, logistics, finance, admin).
export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: number;
  declare username: string;
  declare email: string;
  declare password: string;
  declare avatar: string | null;
  declare status: UserStatus;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // The hash never leaves the server, not even by accident in a JSON response.
  toJSON(): PublicUser {
    const { password: _hash, ...publicUser } = this.get({ plain: true });
    return publicUser;
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: "uq_users_username",
      validate: { len: { args: [3, 80], msg: "username debe tener entre 3 y 80 caracteres" } },
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: "uq_users_email",
      validate: { isEmail: { msg: "email debe ser un correo válido" } },
    },
    password: {
      // bcrypt hashes are 60 characters; 255 leaves room for future algorithms.
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { notEmpty: { msg: "password no puede estar vacío" } },
    },
    avatar: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "inactive",
    },
  },
  {
    sequelize,
    tableName: "users",
    modelName: "User",
    underscored: true,
    timestamps: true,
    hooks: {
      // Every write path (create, update, seeder bulkCreate) hashes here: a plain password
      // can never be persisted. Algorithm and cost live in shared/auth/password.ts.
      beforeCreate: async (user: User) => {
        user.password = await hashPassword(user.password);
      },
      beforeUpdate: async (user: User) => {
        if (user.changed("password")) {
          user.password = await hashPassword(user.password);
        }
      },
      beforeBulkCreate: async (users: User[]) => {
        for (const user of users) {
          user.password = await hashPassword(user.password);
        }
      },
      // username and email are compared by equality at login: always trimmed and lowercase.
      beforeValidate: (user: User) => {
        if (typeof user.username === "string") user.username = user.username.trim().toLowerCase();
        if (typeof user.email === "string") user.email = user.email.trim().toLowerCase();
      },
    },
  }
);
