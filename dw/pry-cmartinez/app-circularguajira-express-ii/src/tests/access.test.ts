/**
 * ISS-13 access middlewares: every catalogued endpoint is JWT + RBAC. Without a valid
 * identity -> 401; with an identity but no active grant -> 403 (deny by default) and the
 * operation does not run; with the grant -> the controller answers. The role matrix of
 * resource-catalog.ts is checked endpoint by endpoint against the seeded grants.
 *
 * Requires the seeded roles and grants (npm run db:seed).
 *
 *   npm run test:access
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { Server } from "node:http";
import { AddressInfo } from "node:net";
import { App } from "../config/index";
import { sequelize } from "../database/db";
import { assertNoPendingMigrations } from "../database/migrator";
import { signAccessToken } from "../shared/auth/jwt";
import { Recycler } from "../features/business/collectors/recycler.model";
import { Weighing } from "../features/business/weighing/weighing.model";
import { Settlement } from "../features/business/settlements/settlement.model";
import { Role } from "../features/auth/roles/role.model";
import { Resource } from "../features/auth/resources/resource.model";
import { ResourceRole } from "../features/auth/resource-roles/resource-role.model";
import { RESOURCE_CATALOG, ROLE_NAMES, RoleName } from "../features/auth/resources/resource-catalog";
import { createTestIdentity, TestIdentity } from "./support/identity";

type Json = Record<string, unknown>;

let server: Server;
let baseUrl = "";
const tag = Date.now().toString().slice(-6);
const identities = new Map<RoleName | "NONE", TestIdentity>();
const cleanup: Array<() => Promise<unknown>> = [];

const api = async (method: string, path: string, bearer: string | null, body?: unknown) => {
  const headers: Record<string, string> = {};
  if (bearer) headers.Authorization = `Bearer ${bearer}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(`${baseUrl}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, body: (await response.json()) as Json };
};

const tokenOf = (key: RoleName | "NONE"): string => identities.get(key)?.token ?? "";

// Concrete request for a resource pattern. Id 0 and an empty body are always rejected by
// the controllers (400), so a granted request is answered without changing any data.
const probe = (method: string, pattern: string, bearer: string | null) =>
  api(method, pattern.replace(/:\w+/g, "0"), bearer, method === "GET" ? undefined : {});

describe("ISS-13 access middlewares (JWT + RBAC)", () => {
  before(async () => {
    await assertNoPendingMigrations();
    server = new App().app.listen(0);
    await new Promise<void>((resolve) => server.once("listening", () => resolve()));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    for (const role of ROLE_NAMES) {
      identities.set(role, await createTestIdentity(`test.${role.toLowerCase()}${tag}`, [role]));
    }
    identities.set("NONE", await createTestIdentity(`test.norole${tag}`, []));
  });

  after(async () => {
    for (const step of cleanup.reverse()) await step();
    for (const identity of identities.values()) await identity.remove();
    server.close();
    await sequelize.close();
  });

  it("answers 401 on every catalogued endpoint without a valid identity", async () => {
    const tampered = `${tokenOf("ADMIN").slice(0, -4)}abcd`;
    const ghost = signAccessToken({ id: 99999999, username: "fantasma" }).token;
    for (const { method, path } of RESOURCE_CATALOG) {
      for (const bearer of [null, "no.es.un.jwt", tampered, ghost]) {
        assert.equal((await probe(method, path, bearer)).status, 401, `${method} ${path} with ${bearer ?? "no token"}`);
      }
    }
  });

  it("denies by default (403) an authenticated user without roles", async () => {
    for (const { method, path } of RESOURCE_CATALOG) {
      const response = await probe(method, path, tokenOf("NONE"));
      assert.equal(response.status, 403, `${method} ${path}`);
    }
  });

  it("applies the role matrix endpoint by endpoint", async () => {
    for (const role of ROLE_NAMES) {
      for (const resource of RESOURCE_CATALOG) {
        const granted = role === "ADMIN" || resource.roles.includes(role);
        const { status } = await probe(resource.method, resource.path, tokenOf(role));
        const label = `${role} ${resource.method} ${resource.path} -> ${status}`;
        if (granted) assert.ok(status !== 401 && status !== 403, label);
        else assert.equal(status, 403, label);
      }
    }
  });

  it("a denied request does not run the operation", async () => {
    const recycler = { name: `TEST Reciclador ${tag}`, documentNumber: `8${tag}`, recyclerType: "independent", phone: "3001112233", status: "active" };
    const recyclers = await Recycler.count();
    assert.equal((await api("POST", "/api/recyclers", tokenOf("BASCULA"), recycler)).status, 403);
    assert.equal(await Recycler.count(), recyclers);
    const created = await api("POST", "/api/recyclers", tokenOf("LOGISTICA"), recycler);
    assert.equal(created.status, 201);
    cleanup.push(() => api("DELETE", `/api/recyclers/${created.body.id as number}`, tokenOf("ADMIN")));

    // Weighings are registered by BASCULA; settlements are issued by FINANZAS.
    const weighings = await Weighing.count();
    const weighing = { collectionId: 1, materialId: 1, grossKg: 10, tareKg: 1 };
    assert.equal((await api("POST", "/api/weighings", tokenOf("LOGISTICA"), weighing)).status, 403);
    assert.equal((await api("POST", "/api/weighings", tokenOf("FINANZAS"), weighing)).status, 403);
    assert.equal(await Weighing.count(), weighings);
    const settlements = await Settlement.count();
    assert.equal((await api("POST", "/api/settlements", tokenOf("BASCULA"), { collectionId: 1 })).status, 403);
    assert.equal((await api("POST", "/api/settlements", tokenOf("LOGISTICA"), { collectionId: 1 })).status, 403);
    assert.equal(await Settlement.count(), settlements);
  });

  it("grants are matched by pattern, ignore the query string and revoke immediately", async () => {
    const role = await Role.create({ name: `TEST_LECTOR_${tag.replace(/\d/g, (d) => "ABCDEFGHIJ"[Number(d)])}`, status: "active" });
    cleanup.push(() => role.destroy());
    const reader = await createTestIdentity(`test.reader${tag}`, []);
    cleanup.push(() => reader.remove());
    const resource = await Resource.findOne({ where: { method: "GET", path: "/api/recyclers/:id" } });
    assert.ok(resource, "run npm run db:seed");
    const grant = await ResourceRole.create({ roleId: role.id, resourceId: resource.id, status: "active" });
    cleanup.push(() => grant.destroy());
    const assigned = await api("POST", "/api/role-users", tokenOf("ADMIN"), { userId: reader.user.id, roleId: role.id });
    assert.equal(assigned.status, 201);

    // GET /api/recyclers/:id covers /api/recyclers/abc (then 400) but not the list.
    assert.equal((await api("GET", "/api/recyclers/abc?x=1", reader.token)).status, 400);
    assert.equal((await api("GET", "/api/recyclers", reader.token)).status, 403);

    await grant.update({ status: "inactive" });
    assert.equal((await api("GET", "/api/recyclers/abc", reader.token)).status, 403);
    await grant.update({ status: "active" });
    assert.equal((await api("GET", "/api/recyclers/abc", reader.token)).status, 400);
    await reader.user.update({ status: "inactive" });
    assert.equal((await api("GET", "/api/recyclers/abc", reader.token)).status, 401);
  });

  it("keeps OPEN endpoints open", async () => {
    assert.equal((await fetch(`${baseUrl}/health`)).status, 200);
    assert.equal((await fetch(`${baseUrl}/api/docs.json`)).status, 200);
  });
});
