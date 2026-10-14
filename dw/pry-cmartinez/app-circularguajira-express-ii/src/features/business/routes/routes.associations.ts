import { Route } from "./route.model";
import { CollectionPoint } from "./collection-point.model";

// Route 1:N CollectionPoint. RESTRICT: a route with points cannot be physically deleted.
Route.hasMany(CollectionPoint, {
  foreignKey: "routeId",
  as: "points",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});
CollectionPoint.belongsTo(Route, { foreignKey: "routeId", as: "route" });
