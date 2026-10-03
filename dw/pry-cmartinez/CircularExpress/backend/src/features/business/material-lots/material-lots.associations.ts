import { Material } from "../materials/material.model";
import { Plant } from "../plants/plant.model";
import { MaterialLot } from "./material-lot.model";

// Plant 1:N MaterialLot and Material 1:N MaterialLot. NO ACTION (portable RESTRICT):
// plants and materials with lots cannot be physically deleted.
const fkOptions = { onDelete: "NO ACTION", onUpdate: "CASCADE" } as const;

MaterialLot.belongsTo(Plant, { foreignKey: { name: "plantId", allowNull: false }, as: "plant", ...fkOptions });
Plant.hasMany(MaterialLot, { foreignKey: { name: "plantId", allowNull: false }, as: "lots", ...fkOptions });

MaterialLot.belongsTo(Material, { foreignKey: { name: "materialId", allowNull: false }, as: "material", ...fkOptions });
Material.hasMany(MaterialLot, { foreignKey: { name: "materialId", allowNull: false }, as: "lots", ...fkOptions });
