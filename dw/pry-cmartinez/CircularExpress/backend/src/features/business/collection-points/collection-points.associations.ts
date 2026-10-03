import { Route } from "../routes/route.model";
import { CollectionPoint } from "./collection-point.model";

// Route 1:N CollectionPoint. NO ACTION (portable RESTRICT): a route with collection points cannot be physically deleted.
CollectionPoint.belongsTo(Route, {
  foreignKey: { name: "routeId", allowNull: false },
  as: "route",
  onDelete: "NO ACTION",
  onUpdate: "CASCADE",
});

Route.hasMany(CollectionPoint, {
  foreignKey: { name: "routeId", allowNull: false },
  as: "collectionPoints",
  onDelete: "NO ACTION",
  onUpdate: "CASCADE",
});
