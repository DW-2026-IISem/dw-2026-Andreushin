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
import { Recycler } from "../recyclers/recycler.model";
import { Route } from "../routes/route.model";

export const COLLECTION_STATUSES = ["active", "inactive"] as const;
export type CollectionStatus = (typeof COLLECTION_STATUSES)[number];

// A collection is a workday ("jornada") of one recycler on one route.
export class Collection extends Model<InferAttributes<Collection>, InferCreationAttributes<Collection>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare description: CreationOptional<string | null>;
  declare collectionDate: string; // DATEONLY, "YYYY-MM-DD"
  declare recyclerId: ForeignKey<Recycler["id"]>;
  declare routeId: ForeignKey<Route["id"]>;
  declare status: CreationOptional<CollectionStatus>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Filled when the query includes the associations.
  declare recycler?: NonAttribute<Recycler>;
  declare route?: NonAttribute<Route>;
}

Collection.init(
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
    collectionDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    recyclerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    routeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "active",
      validate: { isIn: [[...COLLECTION_STATUSES]] },
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "Collection",
    tableName: "collections",
    timestamps: true,
    underscored: true,
    // One workday per recycler, route and date.
    indexes: [
      {
        name: "collections_recycler_route_date_unique",
        unique: true,
        fields: ["recycler_id", "route_id", "collection_date"],
      },
    ],
  }
);
