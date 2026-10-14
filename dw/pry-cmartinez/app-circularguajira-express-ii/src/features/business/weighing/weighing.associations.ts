import { Collection } from "./collection.model";
import { Weighing } from "./weighing.model";
import { Recycler } from "../collectors/recycler.model";
import { Route } from "../routes/route.model";
import { Material } from "../materials/material.model";
import { MaterialRate } from "../materials/material-rate.model";

// Recycler 1:N Collection and Route 1:N Collection.
Collection.belongsTo(Recycler, { foreignKey: "recyclerId", as: "recycler" });
Recycler.hasMany(Collection, { foreignKey: "recyclerId", as: "collections" });
Collection.belongsTo(Route, { foreignKey: "routeId", as: "route" });
Route.hasMany(Collection, { foreignKey: "routeId", as: "collections" });

// Collection 1:N Weighing; Material 1:N Weighing; each weighing keeps the rate it applied.
Collection.hasMany(Weighing, { foreignKey: "collectionId", as: "weighings" });
Weighing.belongsTo(Collection, { foreignKey: "collectionId", as: "collection" });
Weighing.belongsTo(Material, { foreignKey: "materialId", as: "material" });
Material.hasMany(Weighing, { foreignKey: "materialId", as: "weighings" });
Weighing.belongsTo(MaterialRate, { foreignKey: "rateId", as: "rate" });
