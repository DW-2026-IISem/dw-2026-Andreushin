import { Material } from "../materials/material.model";
import { MaterialRate } from "./material-rate.model";

// Material 1:N MaterialRate (rate history). NO ACTION (portable RESTRICT): materials with rates cannot be physically deleted.
const fkOptions = { onDelete: "NO ACTION", onUpdate: "CASCADE" } as const;

MaterialRate.belongsTo(Material, { foreignKey: { name: "materialId", allowNull: false }, as: "material", ...fkOptions });
Material.hasMany(MaterialRate, { foreignKey: { name: "materialId", allowNull: false }, as: "rates", ...fkOptions });
