import { Recycler } from "../recyclers/recycler.model";
import { Route } from "../routes/route.model";
import { Collection } from "./collection.model";

// Recycler 1:N Collection and Route 1:N Collection. NO ACTION (portable RESTRICT):
// recyclers and routes with collections cannot be physically deleted.
const fkOptions = { onDelete: "NO ACTION", onUpdate: "CASCADE" } as const;

Collection.belongsTo(Recycler, { foreignKey: { name: "recyclerId", allowNull: false }, as: "recycler", ...fkOptions });
Recycler.hasMany(Collection, { foreignKey: { name: "recyclerId", allowNull: false }, as: "collections", ...fkOptions });

Collection.belongsTo(Route, { foreignKey: { name: "routeId", allowNull: false }, as: "route", ...fkOptions });
Route.hasMany(Collection, { foreignKey: { name: "routeId", allowNull: false }, as: "collections", ...fkOptions });
