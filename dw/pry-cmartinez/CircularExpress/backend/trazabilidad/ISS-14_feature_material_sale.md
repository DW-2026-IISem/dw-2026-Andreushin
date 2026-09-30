# ISS-14 — Feature MaterialSale (Ventas de Lotes Procesados)

| Campo | Detalle |
| :--- | :--- |
| **Identificador** | `ISS-14` |
| **Módulo / Feature** | `src/features/business/feature-material-sale` |
| **Prerrequisitos (DoR)** | ISS-12 |
| **Sistema Objetivo** | CircularGuajira Backend API (Express 5 + TS + Sequelize) |

---

## 1. Definición de Ready (DoR)
Antes de iniciar el desarrollo de esta Issue, verifica que:
1. Las Issues de prerrequisito (**ISS-12**) hayan sido completadas y verificadas.
2. El entorno de desarrollo y la base de datos estén operativos.

---

## 2. Descripción y Objetivos
### 15. ISS-14 — Feature MaterialSale (Venta de Materiales Procesados)

### Detalle de Implementación
**Objetivo:** Registro de comercialización de lotes a transformadores finales (`material_sales`, FK `material_lot_id`).
**Bloqueado por:** ISS-13.

```bash
mkdir -p src/features/business/material-sale/http
: > src/features/business/material-sale/material-sale.model.ts
cat >> src/features/business/material-sale/material-sale.model.ts << 'EOF'
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";

export class MaterialSale extends Model {
  public id!: number;
  public name!: string;
  public description!: string;
  public quantity!: number;
  public unit_price!: number;
  public total_amount!: number;
  public material_lot_id!: number;
  public status!: "active" | "inactive";
}

MaterialSale.init(
  {
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING, allowNull: true },
    quantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    unit_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    total_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    material_lot_id: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.ENUM("active", "inactive"), defaultValue: "active", allowNull: false },
  },
  { sequelize, modelName: "MaterialSale", tableName: "material_sales", timestamps: true }
);
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
