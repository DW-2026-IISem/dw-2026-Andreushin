# ISS-13 — Feature Weighing (Pesajes en Balanza con Tara y Peso Neto)

| Campo | Detalle |
| :--- | :--- |
| **Identificador** | `ISS-13` |
| **Módulo / Feature** | `src/features/business/feature-weighing` |
| **Prerrequisitos (DoR)** | ISS-08, ISS-09 |
| **Sistema Objetivo** | CircularGuajira Backend API (Express 5 + TS + Sequelize) |

---

## 1. Definición de Ready (DoR)
Antes de iniciar el desarrollo de esta Issue, verifica que:
1. Las Issues de prerrequisito (**ISS-08, ISS-09**) hayan sido completadas y verificadas.
2. El entorno de desarrollo y la base de datos estén operativos.

---

## 2. Descripción y Objetivos
### 14. ISS-13 — Feature Weighing (Pesajes y Tara)

### Detalle de Implementación
**Objetivo:** Captura de peso bruto, tara y cálculo de peso neto por material (`weighings`, FK `collection_id`, `material_id`, `material_lot_id`).
**Bloqueado por:** ISS-12.

```bash
mkdir -p src/features/business/weighing/http
: > src/features/business/weighing/weighing.model.ts
cat >> src/features/business/weighing/weighing.model.ts << 'EOF'
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";

export class Weighing extends Model {
  public id!: number;
  public name!: string;
  public description!: string;
  public gross_weight!: number;
  public tare_weight!: number;
  public net_weight!: number;
  public collection_id!: number;
  public material_id!: number;
  public material_lot_id!: number;
  public status!: "active" | "inactive";
}

Weighing.init(
  {
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING, allowNull: true },
    gross_weight: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    tare_weight: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    net_weight: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    collection_id: { type: DataTypes.INTEGER, allowNull: false },
    material_id: { type: DataTypes.INTEGER, allowNull: false },
    material_lot_id: { type: DataTypes.INTEGER, allowNull: true },
    status: { type: DataTypes.ENUM("active", "inactive"), defaultValue: "active", allowNull: false },
  },
  { sequelize, modelName: "Weighing", tableName: "weighings", timestamps: true }
);
EOF
```

```bash
: > src/features/business/weighing/weighing.associations.ts
cat >> src/features/business/weighing/weighing.associations.ts << 'EOF'
import { Weighing } from "./weighing.model";
import { Collection } from "../collection/collection.model";
import { Material } from "../material/material.model";
import { MaterialLot } from "../material-lot/material-lot.model";

Weighing.belongsTo(Collection, { foreignKey: "collection_id", as: "collection" });
Weighing.belongsTo(Material, { foreignKey: "material_id", as: "material" });
Weighing.belongsTo(MaterialLot, { foreignKey: "material_lot_id", as: "material_lot" });

Collection.hasMany(Weighing, { foreignKey: "collection_id", as: "weighings" });
Material.hasMany(Weighing, { foreignKey: "material_id", as: "weighings" });
MaterialLot.hasMany(Weighing, { foreignKey: "material_lot_id", as: "weighings" });
EOF
```

---

---

## 3. Definición de Done (DoD) y Verificación
Para marcar esta Issue como **Completada**, debes validar:
1. Compilación de TypeScript exitosa (`npm run build` o `npx tsc --noEmit`).
2. Arranque del servidor sin errores de sintaxis o de conexión a BD (`npm run dev`).
3. Ejecución y respuesta HTTP esperada en los endpoints del módulo (`.http` / REST Client).
4. Verificación de persistencia en la base de datos o interfaz Swagger `/api/docs`.
