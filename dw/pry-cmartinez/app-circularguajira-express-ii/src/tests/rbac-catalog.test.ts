/**
 * ISS-11 roles and resources: CRUD through the HTTP API (JWT + RBAC, ADMIN caller) and coverage of the
 * resource catalog against the documented API, so no endpoint is left outside the matrix.
 *
 *   npm run test:rbac
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { Server } from "node:http";
import { AddressInfo } from "node:net";
import { App } from "../config/index";
import { sequelize } from "../database/db";
import { assertNoPendingMigrations } from "../database/migrator";
import { createTestIdentity } from "./support/identity";
import { RoleUser } from "../features/auth/role-users/role-user.model";
import { ResourceRole } from "../features/auth/resource-roles/resource-role.model";
import { RESOURCE_CATALOG } from "../features/auth/resources/resource-catalog";

type Json = Record<string, unknown>;

let server: Server;
let baseUrl = "";
let token = "";
const tag = Date.now().toString().slice(-6);
const letters = tag.replace(/\d/g, (d) => "ABCDEFGHIJ"[Number(d)]);
const cleanup: Array<() => Promise<unknown>> = [];

const api = async (method: string, path: string, body?: unknown, bearer: string | null = token) => {
  const headers: Record<string, string> = {};
  if (bearer) headers.Authorization = `Bearer ${bearer}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(`${baseUrl}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, body: (await response.json()) as Json };
};

describe("ISS-11 roles and resources", () => {
  let userId = 0;

  before(async () => {
    await assertNoPendingMigrations();
    server = new App().app.listen(0);
    await new Promise<void>((resolve) => server.once("listening", () => resolve()));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const caller = await createTestIdentity(`test.rbac${tag}`, ["ADMIN"]);
    userId = caller.user.id;
    cleanup.push(() => caller.remove());
    token = caller.token;
  });

  after(async () => {
    for (const step of cleanup.reverse()) await step();
    server.close();
    await sequelize.close();
  });

  it("covers every documented operation with a catalog resource", async () => {
    const docs = (await api("GET", "/api/docs.json", undefined, null)).body as { paths: Record<string, Record<string, unknown>> };
    const documented = Object.entries(docs.paths).flatMap(([path, operations]) =>
      Object.keys(operations).map((method) => `${method.toUpperCase()} ${path.replace(/\{(\w+)\}/g, ":$1")}`)
    );
    const catalog = new Set(RESOURCE_CATALOG.map((r) => `${r.method} ${r.path}`));
    assert.equal(catalog.size, RESOURCE_CATALOG.length, "duplicated (method, path) in the catalog");
    assert.deepEqual(documented.filter((op) => !catalog.has(op)), [], "documented operations missing from the catalog");
    // And every catalogued resource is a real, documented operation.
    assert.deepEqual([...catalog].filter((op) => !documented.includes(op)), [], "catalogued resources missing from the API");
  });

  it("requires a valid token (401)", async () => {
    assert.equal((await api("GET", "/api/roles", undefined, null)).status, 401);
    assert.equal((await api("GET", "/api/resources", undefined, null)).status, 401);
  });

  it("roles: unique uppercase name, CRUD and logical/physical delete", async () => {
    const created = await api("POST", "/api/roles", { name: `auditoria_${letters}`, description: "Solo lectura" });
    assert.equal(created.status, 201);
    const roleId = created.body.id as number;
    assert.equal(created.body.name, `AUDITORIA_${letters}`);
    assert.equal((await api("POST", "/api/roles", { name: `Auditoria_${letters}` })).status, 409);
    assert.equal((await api("POST", "/api/roles", { name: "con espacios 1" })).status, 400);
    assert.equal((await api("PUT", `/api/roles/${roleId}`, { name: `auditoria_${letters}`, description: "Auditoría" })).status, 200);
    assert.equal((await api("PATCH", `/api/roles/${roleId}`, { description: "Auditoría operativa" })).body.description, "Auditoría operativa");

    const assignment = await RoleUser.create({ userId, roleId, status: "active" });
    assert.equal((await api("DELETE", `/api/roles/${roleId}`)).status, 409);
    await assignment.destroy();

    assert.equal((await api("PATCH", `/api/roles/${roleId}/deactivate`)).status, 200);
    assert.equal((await api("GET", `/api/roles/${roleId}`)).status, 404);
    assert.equal((await api("DELETE", `/api/roles/${roleId}`)).status, 200);
  });

  it("resources: normalized unique (method, path), CRUD and logical/physical delete", async () => {
    const created = await api("POST", "/api/resources", { method: "get", path: `/api/test-${tag}/reports/:id/`, description: "Reporte" });
    assert.equal(created.status, 201);
    const resourceId = created.body.id as number;
    assert.deepEqual([created.body.method, created.body.path], ["GET", `/api/test-${tag}/reports/:id`]);
    assert.equal((await api("POST", "/api/resources", { method: "GET", path: `/api/test-${tag}/reports/:id` })).status, 409);
    assert.equal((await api("POST", "/api/resources", { method: "GET", path: "reportes" })).status, 400);
    assert.equal((await api("POST", "/api/resources", { method: "TRACE", path: `/api/test-${tag}` })).status, 400);
    const other = await api("POST", "/api/resources", { method: "POST", path: `/api/test-${tag}/reports` });
    cleanup.push(() => api("DELETE", `/api/resources/${other.body.id as number}`));
    assert.equal((await api("PATCH", `/api/resources/${resourceId}`, { method: "POST", path: `/api/test-${tag}/reports` })).status, 409);
    assert.equal((await api("PUT", `/api/resources/${resourceId}`, { method: "GET", path: `/api/test-${tag}/reports/:id`, description: "Reporte por id" })).status, 200);

    const roleId = ((await api("POST", "/api/roles", { name: `temp_${letters}` })).body.id as number);
    cleanup.push(() => api("DELETE", `/api/roles/${roleId}`));
    const grant = await ResourceRole.create({ roleId, resourceId, status: "active" });
    assert.equal((await api("DELETE", `/api/resources/${resourceId}`)).status, 409);
    await grant.destroy();

    assert.equal((await api("PATCH", `/api/resources/${resourceId}/deactivate`)).status, 200);
    assert.equal((await api("GET", `/api/resources/${resourceId}`)).status, 404);
    assert.equal((await api("DELETE", `/api/resources/${resourceId}`)).status, 200);
  });
});
