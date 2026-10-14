/**
 * ISS-12 assignments (user <-> role) and grants (role <-> resource) through the HTTP API,
 * their immediate effect on the effective permissions, and reconcileRole determinism.
 *
 *   npm run test:permissions
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { Server } from "node:http";
import { AddressInfo } from "node:net";
import { App } from "../config/index";
import { sequelize } from "../database/db";
import { assertNoPendingMigrations } from "../database/migrator";
import { createTestIdentity, TestIdentity } from "./support/identity";
import { User } from "../features/auth/users/user.model";
import { Role } from "../features/auth/roles/role.model";
import { Resource } from "../features/auth/resources/resource.model";
import { RoleUser } from "../features/auth/role-users/role-user.model";
import { ResourceRole } from "../features/auth/resource-roles/resource-role.model";
import { ResourceRolesService } from "../features/auth/resource-roles/resource-roles.service";

type Json = Record<string, unknown>;

let server: Server;
let baseUrl = "";
let token = "";
let admin: TestIdentity;
const tag = Date.now().toString().slice(-6);
const letters = tag.replace(/\d/g, (d) => "ABCDEFGHIJ"[Number(d)]);

const api = async (method: string, path: string, body?: unknown) => {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(`${baseUrl}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, body: (await response.json()) as Json };
};

describe("ISS-12 assignments and grants", () => {
  const ids = { user: 0, inactiveUser: 0, role: 0, inactiveRole: 0, resources: [] as number[] };

  before(async () => {
    await assertNoPendingMigrations();
    server = new App().app.listen(0);
    await new Promise<void>((resolve) => server.once("listening", () => resolve()));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;

    const user = await User.create({ username: `test.perm${tag}`, email: `test.perm${tag}@circularguajira.co`, password: "Clave2026!", status: "active" });
    const inactiveUser = await User.create({ username: `test.off${tag}`, email: `test.off${tag}@circularguajira.co`, password: "Clave2026!", status: "inactive" });
    const role = await Role.create({ name: `TEST_${letters}`, status: "active" });
    const inactiveRole = await Role.create({ name: `TEST_OFF_${letters}`, status: "inactive" });
    for (const suffix of ["a", "b", "c"]) {
      ids.resources.push((await Resource.create({ method: "POST", path: `/api/test-${tag}/${suffix}`, status: "active" })).id);
    }
    Object.assign(ids, { user: user.id, inactiveUser: inactiveUser.id, role: role.id, inactiveRole: inactiveRole.id });
    admin = await createTestIdentity(`test.padm${tag}`, ["ADMIN"]);
    token = admin.token;
  });

  after(async () => {
    await ResourceRole.destroy({ where: { roleId: [ids.role, ids.inactiveRole] } });
    await RoleUser.destroy({ where: { userId: [ids.user, ids.inactiveUser] } });
    await Resource.destroy({ where: { id: ids.resources } });
    await Role.destroy({ where: { id: [ids.role, ids.inactiveRole] } });
    await User.destroy({ where: { id: [ids.user, ids.inactiveUser] } });
    await admin.remove();
    server.close();
    await sequelize.close();
  });

  it("assigns a role idempotently: 201, 409, revoke, reactivate", async () => {
    const created = await api("POST", "/role-users", { userId: ids.user, roleId: ids.role });
    assert.equal(created.status, 201);
    assert.deepEqual((created.body.role as Json).name, `TEST_${letters}`);
    assert.equal(JSON.stringify(created.body).includes("password"), false);
    const assignmentId = created.body.id as number;

    assert.equal((await api("POST", "/role-users", { userId: ids.user, roleId: ids.role })).status, 409);
    assert.equal((await api("PATCH", `/role-users/${assignmentId}/deactivate`)).status, 200);
    assert.equal((await api("GET", `/role-users/${assignmentId}`)).status, 404);
    const again = await api("POST", "/role-users", { userId: ids.user, roleId: ids.role });
    assert.deepEqual([again.status, again.body.id], [200, assignmentId]);
    assert.equal((await api("PATCH", `/role-users/${assignmentId}/reactivate`)).status, 409);
  });

  it("rejects inactive or missing users and roles (404) and bad ids (400)", async () => {
    assert.equal((await api("POST", "/role-users", { userId: ids.inactiveUser, roleId: ids.role })).status, 404);
    assert.equal((await api("POST", "/role-users", { userId: ids.user, roleId: ids.inactiveRole })).status, 404);
    assert.equal((await api("POST", "/resource-roles", { roleId: ids.role, resourceId: 99999999 })).status, 404);
    assert.equal((await api("POST", "/role-users", { userId: "1", roleId: ids.role })).status, 400);
    assert.equal((await api("GET", "/resource-roles?roleId=abc")).status, 400);
  });

  it("grants a resource with immediate effect on the effective permissions", async () => {
    const [a] = ids.resources;
    const granted = await api("POST", "/resource-roles", { roleId: ids.role, resourceId: a });
    assert.equal(granted.status, 201);
    const grantId = granted.body.id as number;
    assert.equal((granted.body.resource as Json).path, `/api/test-${tag}/a`);
    assert.equal((await api("POST", "/resource-roles", { roleId: ids.role, resourceId: a })).status, 409);

    const byRole = await api("GET", `/resource-roles?roleId=${ids.role}`);
    assert.deepEqual((byRole.body.grants as Json[]).map((g) => g.resourceId), [a]);
    const byResource = await api("GET", `/resource-roles?resourceId=${a}`);
    assert.deepEqual((byResource.body.grants as Json[]).map((g) => g.roleId), [ids.role]);

    const permissions = async () => ((await api("GET", `/users/${ids.user}/permissions`)).body.permissions as Json[]).map((p) => p.path);
    assert.deepEqual(await permissions(), [`/api/test-${tag}/a`]);
    assert.equal((await api("PATCH", `/resource-roles/${grantId}/deactivate`)).status, 200);
    assert.deepEqual(await permissions(), []);
    assert.equal((await api("PATCH", `/resource-roles/${grantId}/reactivate`)).status, 200);
    assert.deepEqual(await permissions(), [`/api/test-${tag}/a`]);
  });

  it("reconcileRole leaves exactly the given set, deterministically", async () => {
    const service = new ResourceRolesService();
    const [a, b, c] = ids.resources;
    const active = async () =>
      (await ResourceRole.findAll({ where: { roleId: ids.role, status: "active" } })).map((g) => g.resourceId).sort();

    assert.deepEqual(await service.reconcileRole(ids.role, [b, c]), { roleId: ids.role, activated: 2, deactivated: 1, totalActive: 2 });
    assert.deepEqual(await active(), [b, c].sort());
    assert.deepEqual(await service.reconcileRole(ids.role, [b, c]), { roleId: ids.role, activated: 0, deactivated: 0, totalActive: 2 });
    assert.deepEqual(await service.reconcileRole(ids.role, [a, b, c]), { roleId: ids.role, activated: 1, deactivated: 0, totalActive: 3 });
    assert.deepEqual(await active(), [a, b, c].sort());
  });
});
