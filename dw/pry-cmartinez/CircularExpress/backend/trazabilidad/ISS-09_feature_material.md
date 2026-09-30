# ISS-09 — Feature Material (Catálogo Base de Materiales)

| Campo | Detalle |
| :--- | :--- |
| **Identificador** | `ISS-09` |
| **Módulo / Feature** | `src/features/business/feature-material` |
| **Prerrequisitos (DoR)** | ISS-03 |
| **Sistema Objetivo** | CircularGuajira Backend API (Express 5 + TS + Sequelize) |

---

## 1. Definición de Ready (DoR)
Antes de iniciar el desarrollo de esta Issue, verifica que:
1. Las Issues de prerrequisito (**ISS-03**) hayan sido completadas y verificadas.
2. El entorno de desarrollo y la base de datos estén operativos.

---

## 2. Descripción y Objetivos
### 10. ISS-09 — Feature Material

### Detalle de Implementación
**Objetivo:** Catálogo de materiales reciclables (`materials`: Plástico PET, Cartón, Vidrio, Chatarra, etc.).
**Bloqueado por:** ISS-08.

```bash
mkdir -p src/features/business/material/http
: > src/features/business/material/material.model.ts
cat >> src/features/business/material/material.model.ts << 'EOF'
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";

export class Material extends Model {
  public id!: number;
  public name!: string;
  public description!: string;
  public status!: "active" | "inactive";
}

Material.init(
  {
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING, allowNull: true },
    status: { type: DataTypes.ENUM("active", "inactive"), defaultValue: "active", allowNull: false },
  },
  { sequelize, modelName: "Material", tableName: "materials", timestamps: true }
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
