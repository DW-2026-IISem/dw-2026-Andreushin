# ISS-15 — Feature Settlement (Liquidaciones de Pago a Recicladores)

| Campo | Detalle |
| :--- | :--- |
| **Identificador** | `ISS-15` |
| **Módulo / Feature** | `src/features/business/feature-settlement` |
| **Prerrequisitos (DoR)** | ISS-13 |
| **Sistema Objetivo** | CircularGuajira Backend API (Express 5 + TS + Sequelize) |

---

## 1. Definición de Ready (DoR)
Antes de iniciar el desarrollo de esta Issue, verifica que:
1. Las Issues de prerrequisito (**ISS-13**) hayan sido completadas y verificadas.
2. El entorno de desarrollo y la base de datos estén operativos.

---

## 2. Descripción y Objetivos
### 16. ISS-15 — Feature Settlement (Liquidaciones a Recicladores)

### Detalle de Implementación
**Objetivo:** Emisión y cálculo de liquidaciones financieras a recicladores (`settlements`, FK `recycler_id`).
**Bloqueado por:** ISS-14.

```bash
mkdir -p src/features/business/settlement/http
: > src/features/business/settlement/settlement.model.ts
cat >> src/features/business/settlement/settlement.model.ts << 'EOF'
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";

export class Settlement extends Model {
  public id!: number;
  public reference_code!: string;
  public date!: Date;
  public amount!: number;
  public state!: "pending" | "approved" | "paid" | "rejected";
  public observations!: string;
  public recycler_id!: number;
  public status!: "active" | "inactive";
}

Settlement.init(
  {
    reference_code: { type: DataTypes.STRING, allowNull: false, unique: true },
    date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    state: { type: DataTypes.ENUM("pending", "approved", "paid", "rejected"), defaultValue: "pending" },
    observations: { type: DataTypes.STRING, allowNull: true },
    recycler_id: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.ENUM("active", "inactive"), defaultValue: "active", allowNull: false },
  },
  { sequelize, modelName: "Settlement", tableName: "settlements", timestamps: true }
);
EOF
```

```bash
: > src/features/business/settlement/settlement.associations.ts
cat >> src/features/business/settlement/settlement.associations.ts << 'EOF'
import { Settlement } from "./settlement.model";
import { Recycler } from "../recycler/recycler.model";

Settlement.belongsTo(Recycler, { foreignKey: "recycler_id", as: "recycler" });
Recycler.hasMany(Settlement, { foreignKey: "recycler_id", as: "settlements" });
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
