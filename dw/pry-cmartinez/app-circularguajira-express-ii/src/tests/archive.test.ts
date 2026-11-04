/**
 * Archive: full lists with inactive rows, ADMIN only. A role that may read a recycler by id
 * must not reach the archive through the `/api/recyclers/:id` pattern, the normal lists stay
 * active-only and the user password is never projected.
 *
 * Requires the seeded roles and grants (npm run db:seed).
 *
 *   npm run test:archive
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { Server } from "node:http";
import { AddressInfo } from "node:net";
import { App } from "../config/index";
import { sequelize } from "../database/db";
import { assertNoPendingMigrations } from "../database/migrator";
import { Recycler } from "../features/business/collectors/recycler.model";
import { ARCHIVE_RESOURCES } from "../features/auth/archive/archive.catalog";
import { ARCHIVE_ENTITIES } from "../features/auth/archive/archive.routes";
import { ROLE_NAMES, RoleName, resourcesForRole } from "../features/auth/resources/resource-catalog";
import { createTestIdentity, TestIdentity } from "./support/identity";

let server: Server;
let baseUrl = "";
const tag = Date.now().toString().slice(-6);
const identities = new Map<RoleName, TestIdentity>();

const get = async (path: string, role?: RoleName) => {
  const token = role ? identities.get(role)?.token : undefined;
  const response = await fetch(`${baseUrl}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  return { status: response.status, body: (await response.json()) as Record<string, Array<Record<string, unknown>>> };
};

describe("Archive (inactive rows, ADMIN only)", () => {
  before(async () => {
    await assertNoPendingMigrations();
    server = new App().app.listen(0);
    await new Promise<void>((resolve) => server.once("listening", () => resolve()));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    for (const role of ROLE_NAMES) {
      identities.set(role, await createTestIdentity(`test.archive.${role.toLowerCase()}${tag}`, [role]));
    }
  });

  after(async () => {
    for (const identity of identities.values()) await identity.remove();
    server.close();
    await sequelize.close();
  });

  it("catalogs exactly the entities it serves, granted to ADMIN alone", () => {
    assert.deepEqual(ARCHIVE_RESOURCES.map(([path]) => path), ARCHIVE_ENTITIES.map(({ path }) => path));
    for (const role of ROLE_NAMES.filter((name) => name !== "ADMIN")) {
      assert.equal(resourcesForRole(role).some((r) => r.path.startsWith("/api/archive/")), false, role);
    }
  });

  it("answers 401 without a token and 403 to every other role on every entity", async () => {
    for (const { path } of ARCHIVE_ENTITIES) {
      assert.equal((await get(`/api/archive/${path}`)).status, 401, path);
      for (const role of ROLE_NAMES.filter((name) => name !== "ADMIN")) {
        assert.equal((await get(`/api/archive/${path}`, role)).status, 403, `${role} ${path}`);
      }
    }
  });

  it("shows ADMIN the inactive rows that the normal list hides", async () => {
    const recycler = await Recycler.create({
      name: `TEST-archivo ${tag}`,
      documentNumber: `77${tag}`,
      recyclerType: "independent",
      phone: "3001234567",
      status: "inactive",
    });
    try {
      const archive = await get("/api/archive/recyclers", "ADMIN");
      assert.equal(archive.status, 200);
      assert.equal(archive.body.recyclers.find((row) => row.id === recycler.id)?.status, "inactive");
      const list = await get("/api/recyclers", "ADMIN");
      assert.equal(list.body.recyclers.some((row) => row.id === recycler.id), false);
    } finally {
      await recycler.destroy();
    }
  });

  it("answers every entity with its list key and never projects the password", async () => {
    for (const { path, key } of ARCHIVE_ENTITIES) {
      const response = await get(`/api/archive/${path}`, "ADMIN");
      assert.equal(response.status, 200, path);
      assert.ok(Array.isArray(response.body[key]), path);
    }
    const { body } = await get("/api/archive/users", "ADMIN");
    assert.ok(body.users.length > 0);
    assert.equal(body.users.some((user) => "password" in user), false);
  });
});
