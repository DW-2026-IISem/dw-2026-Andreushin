/**
 * ISS-CR-02 permission matrix: POST /api/resource-roles/reconcile saves the whole set of a role
 * in one transaction (grant, reactivate, revoke), validates before touching anything, and takes
 * effect on the next request. Everything runs on throwaway rows (role, resources, user).
 *
 *   npm run test:matrix
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { Server } from "node:http";
import { AddressInfo } from "node:net";
import { App } from "../config/index";
import { sequelize } from "../database/db";
import { assertNoPendingMigrations } from "../database/migrator";
import { signAccessToken } from "../shared/auth/jwt";
import { createTestIdentity, TestIdentity } from "./support/identity";
import { User } from "../features/auth/users/user.model";
import { Role } from "../features/auth/roles/role.model";
import { Resource } from "../features/auth/resources/resource.model";
import { RoleUser } from "../features/auth/role-users/role-user.model";
import { ResourceRole } from "../features/auth/resource-roles/resource-role.model";
import { ResourceRolesService } from "../features/auth/resource-roles/resource-roles.service";

type Json = Record<string, unknown>;

const RECONCILE = "/api/resource-roles/reconcile";

let server: Server;
let baseUrl = "";
let admin: TestIdentity;
let logistica: TestIdentity;
let member: User;
let memberToken = "";
const tag = Date.now().toString().slice(-6);
const letters = tag.replace(/\d/g, (d) => "ABCDEFGHIJ"[Number(d)]);

const api = async (method: string, path: string, body?: unknown, bearer: string | null = admin.token) => {
  const headers: Record<string, string> = {};
  if (bearer) headers.Authorization = `Bearer ${bearer}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(`${baseUrl}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, body: (await response.json()) as Json };
};

describe("ISS-CR-02 permission matrix (reconcile)", () => {
  const ids = { role: 0, inactiveRole: 0, inactiveResource: 0, freshResource: 0, recyclersRead: 0, resources: [] as number[] };

  // Active grants of the throwaway role, as the panel reads them.
  const activeResourceIds = async (): Promise<number[]> => {
    const { body } = await api("GET", `/api/resource-roles?roleId=${ids.role}`);
    return (body.grants as Array<{ resourceId: number }>).map((grant) => grant.resourceId).sort((a, b) => a - b);
  };
  const save = (resourceIds: unknown, roleId: unknown = ids.role) => api("POST", RECONCILE, { roleId, resourceIds });

  before(async () => {
    await assertNoPendingMigrations();
    server = new App().app.listen(0);
    await new Promise<void>((resolve) => server.once("listening", () => resolve()));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

    const role = await Role.create({ name: `MATRIX_${letters}`, status: "active" });
    const inactiveRole = await Role.create({ name: `MATRIX_OFF_${letters}`, status: "inactive" });
    for (const suffix of ["a", "b", "c", "d"]) {
      ids.resources.push((await Resource.create({ method: "POST", path: `/api/matrix-${tag}/${suffix}`, status: "active" })).id);
    }
    const off = await Resource.create({ method: "POST", path: `/api/matrix-${tag}/off`, status: "inactive" });
    // Never granted by any other test: its first grant is an INSERT (the rollback test).
    const fresh = await Resource.create({ method: "POST", path: `/api/matrix-${tag}/fresh`, status: "active" });
    const recyclersRead = await Resource.findOne({ where: { method: "GET", path: "/api/recyclers", status: "active" } });
    if (!recyclersRead) throw new Error("Resource GET /api/recyclers not found: run npm run db:seed");
    Object.assign(ids, { role: role.id, inactiveRole: inactiveRole.id, inactiveResource: off.id, freshResource: fresh.id, recyclersRead: recyclersRead.id });

    // A user whose ONLY role is the throwaway one: its access is exactly what the matrix says.
    member = await User.create({ username: `test.mx${tag}`, email: `test.mx${tag}@circularguajira.co`, password: "Clave2026!", status: "active" });
    await RoleUser.create({ userId: member.id, roleId: role.id, status: "active" });
    memberToken = signAccessToken(member).token;

    admin = await createTestIdentity(`test.mxadm${tag}`, ["ADMIN"]);
    logistica = await createTestIdentity(`test.mxlog${tag}`, ["LOGISTICA"]);
  });

  after(async () => {
    await ResourceRole.destroy({ where: { roleId: [ids.role, ids.inactiveRole] } });
    await RoleUser.destroy({ where: { userId: member.id } });
    await Resource.destroy({ where: { id: [...ids.resources, ids.inactiveResource, ids.freshResource] } });
    await Role.destroy({ where: { id: [ids.role, ids.inactiveRole] } });
    await User.destroy({ where: { id: member.id } });
    await admin.remove();
    await logistica.remove();
    server.close();
    await sequelize.close();
  });

  it("requires a token (401) and the reconcile grant (403: ADMIN only)", async () => {
    assert.equal((await api("POST", RECONCILE, { roleId: ids.role, resourceIds: [] }, null)).status, 401);
    assert.equal((await api("POST", RECONCILE, { roleId: ids.role, resourceIds: [] }, logistica.token)).status, 403);
    assert.deepEqual(await activeResourceIds(), []);
  });

  it("rejects an invalid payload with 400 and changes nothing", async () => {
    const [a] = ids.resources;
    const invalid: Array<[string, unknown]> = [
      ["no body", undefined],
      ["array body", [a]],
      ["missing roleId", { resourceIds: [a] }],
      ["roleId as text", { roleId: String(ids.role), resourceIds: [a] }],
      ["roleId zero", { roleId: 0, resourceIds: [a] }],
      ["missing resourceIds", { roleId: ids.role }],
      ["resourceIds not an array", { roleId: ids.role, resourceIds: String(a) }],
      ["duplicated ids", { roleId: ids.role, resourceIds: [a, a] }],
      ["zero id", { roleId: ids.role, resourceIds: [0] }],
      ["decimal id", { roleId: ids.role, resourceIds: [1.5] }],
      ["text id", { roleId: ids.role, resourceIds: [String(a)] }],
      ["unknown resource beside a valid one", { roleId: ids.role, resourceIds: [a, 2_000_000_000] }],
      ["inactive resource beside a valid one", { roleId: ids.role, resourceIds: [a, ids.inactiveResource] }],
    ];
    for (const [label, body] of invalid) {
      const response = await api("POST", RECONCILE, body);
      assert.equal(response.status, 400, label);
      assert.equal(typeof response.body.message, "string", label);
    }
    assert.deepEqual(await activeResourceIds(), [], "the valid id sent beside an invalid one must not be granted");
  });

  it("answers 404 for an unknown or inactive role", async () => {
    const [a] = ids.resources;
    assert.equal((await save([a], 2_000_000_000)).status, 404);
    assert.equal((await save([a], ids.inactiveRole)).status, 404);
  });

  it("grants, keeps, reactivates and revokes; running it again changes nothing", async () => {
    const [a, b, c, d] = ids.resources;

    // Empty role -> a, b, c: three new grants.
    const first = await save([a, b, c]);
    assert.equal(first.status, 200);
    assert.equal(first.body.message, "Permisos del rol actualizados");
    assert.deepEqual(first.body.result, { roleId: ids.role, activated: 3, deactivated: 0, totalActive: 3 });
    assert.deepEqual(await activeResourceIds(), [a, b, c]);

    // b stays, d is new, a and c are revoked (logical: the rows remain, inactive).
    const second = await save([b, d]);
    assert.deepEqual(second.body.result, { roleId: ids.role, activated: 1, deactivated: 2, totalActive: 2 });
    assert.deepEqual(await activeResourceIds(), [b, d]);
    assert.equal(await ResourceRole.count({ where: { roleId: ids.role } }), 4, "revoking keeps the rows (audit trail)");

    // a comes back by reactivation (no new row), d is revoked.
    const third = await save([a, b]);
    assert.deepEqual(third.body.result, { roleId: ids.role, activated: 1, deactivated: 1, totalActive: 2 });
    assert.deepEqual(await activeResourceIds(), [a, b]);
    assert.equal(await ResourceRole.count({ where: { roleId: ids.role } }), 4);

    // Same set again: idempotent.
    assert.deepEqual((await save([a, b])).body.result, { roleId: ids.role, activated: 0, deactivated: 0, totalActive: 2 });
  });

  it("an empty list is deliberate: it revokes every grant of the role", async () => {
    const [a, b] = ids.resources;
    await save([a, b]);
    const cleared = await save([]);
    assert.equal(cleared.status, 200);
    assert.deepEqual(cleared.body.result, { roleId: ids.role, activated: 0, deactivated: 2, totalActive: 0 });
    assert.deepEqual(await activeResourceIds(), []);
  });

  it("rolls back every change when the transaction fails midway", async () => {
    const [a] = ids.resources;
    await save([]);
    // `fresh` is INSERTED and `a` (a revoked row from the previous tests) is REACTIVATED; then
    // the unknown id violates the foreign key. Both writes must be undone: all or nothing.
    await assert.rejects(new ResourceRolesService().reconcileRole(ids.role, [ids.freshResource, a, 2_000_000_000]));
    assert.equal(await ResourceRole.count({ where: { roleId: ids.role, resourceId: ids.freshResource } }), 0, "the insert was rolled back");
    assert.equal(await ResourceRole.count({ where: { roleId: ids.role, resourceId: a, status: "active" } }), 0, "the reactivation was rolled back");
    assert.deepEqual(await activeResourceIds(), []);
  });

  it("changes the real access on the next request: 403, then 200, then 403", async () => {
    const readRecyclers = () => api("GET", "/api/recyclers", undefined, memberToken);
    await save([]);
    assert.equal((await readRecyclers()).status, 403);

    await save([ids.recyclersRead]);
    assert.equal((await readRecyclers()).status, 200);
    // Granted GET only: the write it was not given stays denied.
    assert.equal((await api("POST", "/api/recyclers", {}, memberToken)).status, 403);

    await save([]);
    assert.equal((await readRecyclers()).status, 403);
  });
});
