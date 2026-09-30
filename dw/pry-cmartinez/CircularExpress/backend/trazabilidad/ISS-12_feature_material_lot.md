# ISS-12 — Feature MaterialLot (Inventario de Lotes en Planta)

| Campo | Detalle |
| :--- | :--- |
| **Identificador** | `ISS-12` |
| **Módulo / Feature** | `src/features/business/feature-material-lot` |
| **Prerrequisitos (DoR)** | ISS-11, ISS-09 |
| **Sistema Objetivo** | CircularGuajira Backend API (Express 5 + TS + Sequelize) |

---

## 1. Definición de Ready (DoR)
Antes de iniciar el desarrollo de esta Issue, verifica que:
1. Las Issues de prerrequisito (**ISS-11, ISS-09**) hayan sido completadas y verificadas.
2. El entorno de desarrollo y la base de datos estén operativos.

---

## 2. Descripción y Objetivos
### 13. ISS-12 — Feature MaterialLot (Lotes de Planta)

### Detalle de Implementación
**Objetivo:** Lotes clasificados y procesados en cada planta (`material_lots`, FK `plant_id`).
**Bloqueado por:** ISS-11.

```bash
mkdir -p src/features/business/material-lot/http
: > src/features/business/material-lot/material-lot.model.ts
cat >> src/features/business/material-lot/material-lot.model.ts << 'EOF'
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";

export class MaterialLot extends Model {
  public id!: number;
  public name!: string;
  public description!: string;
  public plant_id!: number;
  public status!: "active" | "inactive";
}

MaterialLot.init(
  {
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING, allowNull: true },
    plant_id: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.ENUM("active", "inactive"), defaultValue: "active", allowNull: false },
  },
  { sequelize, modelName: "MaterialLot", tableName: "material_lots", timestamps: true }
);
EOF
```

```bash
: > src/features/business/material-lot/material-lot.associations.ts
cat >> src/features/business/material-lot/material-lot.associations.ts << 'EOF'
import { MaterialLot } from "./material-lot.model";
import { Plant } from "../plant/plant.model";

MaterialLot.belongsTo(Plant, { foreignKey: "plant_id", as: "plant" });
Plant.hasMany(MaterialLot, { foreignKey: "plant_id", as: "lots" });
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
