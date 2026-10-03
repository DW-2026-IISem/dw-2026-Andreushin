import { MaterialLot } from "../material-lots/material-lot.model";
import { MaterialSale } from "./material-sale.model";

// MaterialLot 1:N MaterialSale. NO ACTION (portable RESTRICT): lots with sales cannot be physically deleted.
const fkOptions = { onDelete: "NO ACTION", onUpdate: "CASCADE" } as const;

MaterialSale.belongsTo(MaterialLot, { foreignKey: { name: "materialLotId", allowNull: false }, as: "materialLot", ...fkOptions });
MaterialLot.hasMany(MaterialSale, { foreignKey: { name: "materialLotId", allowNull: false }, as: "sales", ...fkOptions });
