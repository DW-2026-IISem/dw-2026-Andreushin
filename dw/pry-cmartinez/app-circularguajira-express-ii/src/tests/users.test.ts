/**
 * ISS-10 users feature through the HTTP API: JWT access mode, the password never in
 * responses, uniqueness, password change, effective permissions and immediate deactivation.
 * Login arrives in a later ISS, so tokens are signed directly with signAccessToken.
 *
 *   npm run test:users
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { Server } from "node:http";
import { AddressInfo } from "node:net";
import { App } from "../config/index";
import { sequelize } from "../database/db";
import { assertNoPendingMigrations } from "../database/migrator";
import { signAccessToken } from "../shared/auth/jwt";
import { verifyPassword } from "../shared/auth/password";
import { User } from "../features/auth/users/user.model";
import { Role } from "../features/auth/roles/role.model";
import { Resource } from "../features/auth/resources/resource.model";
import { RoleUser } from "../features/auth/role-users/role-user.model";
import { ResourceRole } from "../features/auth/resource-roles/resource-role.model";

type Json = Record<string, unknown>;
interface ApiResponse {
  status: number;
  body: Json;
  raw: string;
}

let server: Server;
let baseUrl = "";
let token = "";
const tag = Date.now().toString().slice(-7);
const cleanup: Array<() => Promise<unknown>> = [];

const api = async (method: string, path: string, body?: unknown, bearer: string | null = token): Promise<ApiResponse> => {
  const headers: Record<string, string> = {};
  if (bearer) headers.Authorization = `Bearer ${bearer}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(`${baseUrl}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const raw = await response.text();
  return { status: response.status, body: JSON.parse(raw) as Json, raw };
};

describe("ISS-10 users API (JWT)", () => {
  let operatorId = 0;

  before(async () => {
    await assertNoPendingMigrations();
    server = new App().app.listen(0);
    await new Promise<void>((resolve) => server.once("listening", () => resolve()));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;

    const caller = await User.create({ username: `test.admin${tag}`, email: `test.admin${tag}@circularguajira.co`, password: "Admin2026!", status: "active" });
    cleanup.push(() => caller.destroy());
    token = signAccessToken(caller).token;
  });

  after(async () => {
    for (const step of cleanup.reverse()) await step();
    server.close();
    await sequelize.close();
  });

  it("rejects requests without a valid token (401)", async () => {
    assert.equal((await api("GET", "/users", undefined, null)).status, 401);
    assert.equal((await api("GET", "/users", undefined, "no-es-un-jwt")).status, 401);
    const foreign = signAccessToken({ id: 999999, username: "fantasma" }).token;
    assert.equal((await api("GET", "/users", undefined, foreign)).status, 401);
  });

  it("creates a user storing only a bcrypt hash and never returning it", async () => {
    const created = await api("POST", "/users", { username: `Operario.${tag}`, email: `operario.${tag}@circularguajira.co`, password: "Bascula2026!" });
    assert.equal(created.status, 201);
    operatorId = created.body.id as number;
    cleanup.push(() => User.destroy({ where: { id: operatorId } }));
    assert.equal(created.body.username, `operario.${tag}`);
    assert.equal(created.raw.includes("password"), false);

    const stored = await User.findByPk(operatorId);
    assert.match(stored?.password ?? "", /^\$2[aby]\$12\$/);
    const list = await api("GET", "/users");
    assert.equal(list.status, 200);
    assert.equal(list.raw.includes("password"), false);
  });

  it("enforces uniqueness (409) and input rules (400)", async () => {
    assert.equal((await api("POST", "/users", { username: `operario.${tag}`, email: `x${tag}@circularguajira.co`, password: "Clave2026!" })).status, 409);
    assert.equal((await api("POST", "/users", { username: `otro.${tag}`, email: `operario.${tag}@circularguajira.co`, password: "Clave2026!" })).status, 409);
    assert.equal((await api("POST", "/users", { username: `debil.${tag}`, email: `debil${tag}@circularguajira.co`, password: "corta" })).status, 400);
    assert.equal((await api("PATCH", `/users/${operatorId}`, { password: "Nueva2026!" })).status, 400);
    assert.equal((await api("GET", "/users/abc")).status, 400);
  });

  it("updates with PUT and PATCH", async () => {
    const put = await api("PUT", `/users/${operatorId}`, { username: `operario.${tag}`, email: `operario.${tag}@circularguajira.co`, avatar: "https://circularguajira.co/a.png" });
    assert.equal(put.status, 200);
    const patch = await api("PATCH", `/users/${operatorId}`, { avatar: null });
    assert.equal(patch.status, 200);
    assert.equal(patch.body.avatar, null);
  });

  it("changes the password only with the current one", async () => {
    assert.equal((await api("PATCH", `/users/${operatorId}/password`, { currentPassword: "Incorrecta1", newPassword: "Bascula2027!" })).status, 400);
    assert.equal((await api("PATCH", `/users/${operatorId}/password`, { currentPassword: "Bascula2026!", newPassword: "Bascula2027!" })).status, 200);
    assert.equal(await verifyPassword("Bascula2027!", (await User.findByPk(operatorId))?.password ?? ""), true);
  });

  it("returns effective permissions only through active links", async () => {
    const role = await Role.create({ name: `TEST_${tag}`, status: "active" });
    const resource = await Resource.create({ method: "POST", path: `/api/test-${tag}/weighings`, status: "active" });
    const grant = await ResourceRole.create({ roleId: role.id, resourceId: resource.id, status: "active" });
    const assignment = await RoleUser.create({ userId: operatorId, roleId: role.id, status: "active" });
    cleanup.push(() => role.destroy(), () => resource.destroy(), () => grant.destroy(), () => assignment.destroy());

    const granted = await api("GET", `/users/${operatorId}/permissions`);
    assert.deepEqual(granted.body.permissions, [{ resourceId: resource.id, method: "POST", path: `/api/test-${tag}/weighings` }]);

    await grant.update({ status: "inactive" });
    assert.deepEqual((await api("GET", `/users/${operatorId}/permissions`)).body.permissions, []);
    await grant.update({ status: "active" });
    await assignment.update({ status: "inactive" });
    assert.deepEqual((await api("GET", `/users/${operatorId}/permissions`)).body.permissions, []);

    // With role assignments the user cannot be physically deleted (FK RESTRICT -> 409).
    assert.equal((await api("DELETE", `/users/${operatorId}`)).status, 409);
  });

  it("deactivation takes effect immediately and physical delete purges", async () => {
    const operator = await User.findByPk(operatorId);
    const operatorToken = signAccessToken({ id: operatorId, username: operator?.username ?? "" }).token;
    assert.equal((await api("GET", "/users", undefined, operatorToken)).status, 200);

    assert.equal((await api("PATCH", `/users/${operatorId}/deactivate`)).status, 200);
    assert.equal((await api("GET", "/users", undefined, operatorToken)).status, 401);
    assert.equal((await api("GET", `/users/${operatorId}`)).status, 404);

    await RoleUser.destroy({ where: { userId: operatorId } });
    assert.equal((await api("DELETE", `/users/${operatorId}`)).status, 200);
    assert.equal(await User.findByPk(operatorId), null);
  });
});
