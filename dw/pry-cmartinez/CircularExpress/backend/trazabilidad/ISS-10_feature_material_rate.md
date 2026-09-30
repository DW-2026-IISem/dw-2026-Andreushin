# ISS-10 — Feature MaterialRate (Tarifas de Materiales por Kilo)

| Campo | Detalle |
| :--- | :--- |
| **Identificador** | `ISS-10` |
| **Módulo / Feature** | `src/features/business/feature-material-rate` |
| **Prerrequisitos (DoR)** | ISS-09 |
| **Sistema Objetivo** | CircularGuajira Backend API (Express 5 + TS + Sequelize) |

---

## 1. Definición de Ready (DoR)
Antes de iniciar el desarrollo de esta Issue, verifica que:
1. Las Issues de prerrequisito (**ISS-09**) hayan sido completadas y verificadas.
2. El entorno de desarrollo y la base de datos estén operativos.

---

## 2. Descripción y Objetivos
### 11. ISS-10 — Feature MaterialRate (Tarifas de Materiales)

### Detalle de Implementación
**Objetivo:** Gestión de precios vigentes por kilo para cada material (`material_rates`, FK `material_id`).
**Bloqueado por:** ISS-09.

```bash
mkdir -p src/features/business/material-rate/http
: > src/features/business/material-rate/material-rate.model.ts
cat >> src/features/business/material-rate/material-rate.model.ts << 'EOF'
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";

export class MaterialRate extends Model {
  public id!: number;
  public name!: string;
  public description!: string;
  public price_per_kg!: number;
  public material_id!: number;
  public status!: "active" | "inactive";
}

MaterialRate.init(
  {
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING, allowNull: true },
    price_per_kg: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    material_id: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.ENUM("active", "inactive"), defaultValue: "active", allowNull: false },
  },
  { sequelize, modelName: "MaterialRate", tableName: "material_rates", timestamps: true }
);
EOF
```

```bash
: > src/features/business/material-rate/material-rate.associations.ts
cat >> src/features/business/material-rate/material-rate.associations.ts << 'EOF'
import { MaterialRate } from "./material-rate.model";
import { Material } from "../material/material.model";

MaterialRate.belongsTo(Material, { foreignKey: "material_id", as: "material" });
Material.hasMany(MaterialRate, { foreignKey: "material_id", as: "rates" });
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
