import { Collection } from "../collections/collection.model";
import { MaterialLot } from "../material-lots/material-lot.model";
import { Material } from "../materials/material.model";
import { Weighing } from "./weighing.model";

// Collection 1:N, Material 1:N and MaterialLot 1:N Weighing. NO ACTION (portable RESTRICT) everywhere;
// for the optional lot FK this also avoids Sequelize's default SET NULL, which would orphan stock.
const fkOptions = { onDelete: "NO ACTION", onUpdate: "CASCADE" } as const;

Weighing.belongsTo(Collection, { foreignKey: { name: "collectionId", allowNull: false }, as: "collection", ...fkOptions });
Collection.hasMany(Weighing, { foreignKey: { name: "collectionId", allowNull: false }, as: "weighings", ...fkOptions });

Weighing.belongsTo(Material, { foreignKey: { name: "materialId", allowNull: false }, as: "material", ...fkOptions });
Material.hasMany(Weighing, { foreignKey: { name: "materialId", allowNull: false }, as: "weighings", ...fkOptions });

Weighing.belongsTo(MaterialLot, { foreignKey: { name: "materialLotId", allowNull: true }, as: "materialLot", ...fkOptions });
MaterialLot.hasMany(Weighing, { foreignKey: { name: "materialLotId", allowNull: true }, as: "weighings", ...fkOptions });
