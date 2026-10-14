import { Role } from "./role.model";
import { RoleName } from "../resources/resource-catalog";

/**
 * Roles catalog seeder: the five roles of the domain. Deterministic and idempotent
 * (findOrCreate by name, reactivated if inactive). Roles are born without permissions;
 * the grants seeder (ISS-12) derives them from resource-catalog.ts.
 */
export const SEED_ROLES: ReadonlyArray<{ name: RoleName; description: string }> = [
  { name: "ADMIN", description: "Control total del sistema y gestión de la matriz RBAC" },
  { name: "LOGISTICA", description: "Coordinación de rutas, puntos de acopio y recepción de entregas" },
  { name: "BASCULA", description: "Registro de pesajes por tipo de material" },
  { name: "PLANTA", description: "Catálogo de materiales, clasificación y lotes para venta" },
  { name: "FINANZAS", description: "Tarifas, liquidaciones y pagos" },
];

export async function seedRoles(): Promise<number> {
  let created = 0;
  for (const item of SEED_ROLES) {
    const [role, wasCreated] = await Role.findOrCreate({
      where: { name: item.name },
      defaults: { ...item, status: "active" },
    });
    if (wasCreated) created += 1;
    else if (role.status !== "active") await role.update({ status: "active" });
  }
  console.log(`✅ roles: catalog reconciled (${SEED_ROLES.length} roles, ${created} new)`);
  return created;
}
