import { Recycler } from "../recyclers/recycler.model";
import { Settlement } from "./settlement.model";

// Recycler 1:N Settlement. NO ACTION (portable RESTRICT): recyclers with settlements cannot be physically deleted.
const fkOptions = { onDelete: "NO ACTION", onUpdate: "CASCADE" } as const;

Settlement.belongsTo(Recycler, { foreignKey: { name: "recyclerId", allowNull: false }, as: "recycler", ...fkOptions });
Recycler.hasMany(Settlement, { foreignKey: { name: "recyclerId", allowNull: false }, as: "settlements", ...fkOptions });
