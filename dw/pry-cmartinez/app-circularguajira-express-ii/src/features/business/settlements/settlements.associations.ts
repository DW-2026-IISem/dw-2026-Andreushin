import { Settlement } from "./settlement.model";
import { Collection } from "../weighing/collection.model";
import { Recycler } from "../collectors/recycler.model";

// Collection 1:N Settlement (at most one issued; voided ones stay as history).
Settlement.belongsTo(Collection, { foreignKey: "collectionId", as: "collection" });
Collection.hasMany(Settlement, { foreignKey: "collectionId", as: "settlements" });

// Recycler 1:N Settlement.
Settlement.belongsTo(Recycler, { foreignKey: "recyclerId", as: "recycler" });
Recycler.hasMany(Settlement, { foreignKey: "recyclerId", as: "settlements" });
