import { Material } from "./crud/materials/material.model";
import { MaterialRate } from "./crud/material-rates/material-rate.model";

// Material 1:N MaterialRate (rate history by validity period). RESTRICT keeps the
// history: a material with rates cannot be physically deleted.
Material.hasMany(MaterialRate, {
  foreignKey: "materialId",
  as: "rates",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});
MaterialRate.belongsTo(Material, { foreignKey: "materialId", as: "material" });
