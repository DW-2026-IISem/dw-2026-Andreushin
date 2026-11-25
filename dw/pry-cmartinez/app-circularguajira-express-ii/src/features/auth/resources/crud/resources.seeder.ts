import { Resource } from "./resource.model";
import { RESOURCE_CATALOG } from "./resource-catalog";

/**
 * Resources catalog seeder: loads resource-catalog.ts (no random data). Idempotent and
 * reconciling: findOrCreate by (method, path) and reactivation of inactive rows, so running
 * it again leaves the exact catalog without duplicates and without losing grants.
 */
export async function seedResources(): Promise<number> {
  let created = 0;
  for (const item of RESOURCE_CATALOG) {
    const [resource, wasCreated] = await Resource.findOrCreate({
      where: { method: item.method, path: item.path },
      defaults: { method: item.method, path: item.path, description: item.description, status: "active" },
    });
    if (wasCreated) created += 1;
    else if (resource.status !== "active") await resource.update({ status: "active" });
  }
  console.log(`✅ resources: catalog reconciled (${RESOURCE_CATALOG.length} resources, ${created} new)`);
  return created;
}
