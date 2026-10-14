/**
 * ISS-15 session: login, refresh with rotation, logout, profile and own permissions, and
 * the three access modes end to end: OPEN (login) -> JWT (profile) -> JWT + RBAC (business).
 * Requires the seeded roles and grants (npm run db:seed).
 *
 *   npm run test:session
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { Server } from "node:http";
import { AddressInfo } from "node:net";
import { App } from "../config/index";
import { sequelize } from "../database/db";
import { assertNoPendingMigrations } from "../database/migrator";
import { sha256Hex } from "../shared/auth/password";
import { accessTokenTtlSeconds } from "../shared/auth/jwt";
import { RefreshToken } from "../features/auth/refresh-tokens/refresh-token.model";
import { resourcesForRole } from "../features/auth/resources/resource-catalog";
import { createTestIdentity, TestIdentity } from "./support/identity";

type Json = Record<string, unknown>;

let server: Server;
let baseUrl = "";
const tag = Date.now().toString().slice(-6);
// Password set by createTestIdentity.
const PASSWORD = "Clave2026!";
let operator: TestIdentity;
let admin: TestIdentity;
let noRole: TestIdentity;

const api = async (method: string, path: string, options: { body?: unknown; bearer?: string } = {}) => {
  const headers: Record<string, string> = { "User-Agent": `session-test/${tag}` };
  if (options.bearer) headers.Authorization = `Bearer ${options.bearer}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const raw = await response.text();
  return { status: response.status, body: JSON.parse(raw) as Json, raw };
};

const login = (identifier: string, password = PASSWORD) =>
  api("POST", "/session/login", { body: { identifier, password } });

const operations = (permissions: Json[]) => permissions.map((p) => `${p.method as string} ${p.path as string}`).sort();

describe("ISS-15 session (OPEN + JWT) and the three access modes", () => {
  before(async () => {
    await assertNoPendingMigrations();
    server = new App().app.listen(0);
    await new Promise<void>((resolve) => server.once("listening", () => resolve()));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
    operator = await createTestIdentity(`test.scale${tag}`, ["BASCULA"]);
    admin = await createTestIdentity(`test.sadm${tag}`, ["ADMIN"]);
    noRole = await createTestIdentity(`test.snone${tag}`, []);
  });

  after(async () => {
    for (const identity of [operator, admin, noRole]) await identity.remove();
    server.close();
    await sequelize.close();
  });

  it("logs in by username or email and returns the token pair without credentials", async () => {
    const byName = await login(operator.user.username);
    assert.equal(byName.status, 200);
    assert.equal(byName.body.tokenType, "Bearer");
    assert.equal(byName.body.expiresIn, accessTokenTtlSeconds());
    assert.ok((byName.body.refreshExpiresIn as number) > 6 * 24 * 3600);
    assert.match(byName.body.refreshToken as string, /^[A-Za-z0-9_-]{86}$/);
    assert.equal(byName.raw.includes("password"), false);

    const stored = await RefreshToken.findOne({ where: { tokenHash: sha256Hex(byName.body.refreshToken as string) } });
    assert.deepEqual([stored?.userId, stored?.deviceInfo], [operator.user.id, `session-test/${tag}`]);
    assert.equal((await login(operator.user.email.toUpperCase())).status, 200);
  });

  it("answers the same 401 for a wrong password, an unknown user or an inactive user", async () => {
    const wrong = await login(operator.user.username, "Incorrecta1");
    const unknown = await login(`fantasma${tag}`);
    assert.deepEqual([wrong.status, unknown.status], [401, 401]);
    assert.equal(wrong.body.message, unknown.body.message);

    await noRole.user.update({ status: "inactive" });
    const inactive = await login(noRole.user.username);
    await noRole.user.update({ status: "active" });
    assert.deepEqual([inactive.status, inactive.body.message], [401, wrong.body.message]);

    assert.equal((await api("POST", "/session/login", { body: { identifier: operator.user.username } })).status, 400);
    assert.equal((await api("POST", "/session/login", { body: "texto" })).status, 400);
  });

  it("walks OPEN -> JWT -> JWT + RBAC with the token of the login", async () => {
    const { accessToken } = (await login(operator.user.username)).body as { accessToken: string };

    assert.equal((await api("GET", "/session/profile")).status, 401);
    const profile = await api("GET", "/session/profile", { bearer: accessToken });
    assert.equal(profile.status, 200);
    assert.deepEqual([profile.body.username, profile.body.roles], [operator.user.username, ["BASCULA"]]);
    assert.equal(profile.raw.includes("password"), false);

    // BASCULA reads weighings but does not settle (deny by default).
    assert.equal((await api("GET", "/weighings", { bearer: accessToken })).status, 200);
    assert.equal((await api("POST", "/settlements", { bearer: accessToken, body: { collectionId: 1 } })).status, 403);
  });

  it("returns the effective permissions of the seeded matrix (JWT, no grant needed)", async () => {
    for (const [identity, role] of [[operator, "BASCULA"], [admin, "ADMIN"]] as const) {
      const { accessToken } = (await login(identity.user.username)).body as { accessToken: string };
      const response = await api("GET", "/session/permissions", { bearer: accessToken });
      assert.equal(response.status, 200);
      const expected = resourcesForRole(role).map((r) => `${r.method} ${r.path}`).sort();
      assert.deepEqual(operations(response.body.permissions as Json[]), expected);
    }
    const { accessToken } = (await login(noRole.user.username)).body as { accessToken: string };
    assert.deepEqual((await api("GET", "/session/permissions", { bearer: accessToken })).body.permissions, []);
  });

  it("rotates the refresh token and revokes the family when an old one is reused", async () => {
    const first = (await login(operator.user.username)).body as { refreshToken: string };
    const rotated = await api("POST", "/session/refresh", { body: { refreshToken: first.refreshToken } });
    assert.equal(rotated.status, 200);
    const next = rotated.body as { accessToken: string; refreshToken: string };
    assert.notEqual(next.refreshToken, first.refreshToken);
    assert.equal((await api("GET", "/session/profile", { bearer: next.accessToken })).status, 200);

    const reuse = await api("POST", "/session/refresh", { body: { refreshToken: first.refreshToken } });
    assert.equal(reuse.status, 401);
    assert.match(reuse.body.message as string, /reutilizado/);
    assert.equal((await api("POST", "/session/refresh", { body: { refreshToken: next.refreshToken } })).status, 401);
    assert.equal((await api("POST", "/session/refresh", { body: { refreshToken: "no-existe" } })).status, 401);
    assert.equal((await api("POST", "/session/refresh", { body: {} })).status, 400);
  });

  it("logs out idempotently and stops renewing a deactivated user", async () => {
    const session = (await login(operator.user.username)).body as { refreshToken: string };
    assert.equal((await api("POST", "/session/logout", { body: { refreshToken: session.refreshToken } })).status, 200);
    assert.equal((await api("POST", "/session/logout", { body: { refreshToken: session.refreshToken } })).status, 200);
    assert.equal((await api("POST", "/session/refresh", { body: { refreshToken: session.refreshToken } })).status, 401);

    const other = (await login(noRole.user.username)).body as { accessToken: string; refreshToken: string };
    await noRole.user.update({ status: "inactive" });
    assert.equal((await api("GET", "/session/profile", { bearer: other.accessToken })).status, 401);
    assert.equal((await api("POST", "/session/refresh", { body: { refreshToken: other.refreshToken } })).status, 401);
    assert.equal(await RefreshToken.count({ where: { userId: noRole.user.id, status: "active" } }), 0);
    await noRole.user.update({ status: "active" });
  });
});
