/**
 * ISS-14 refresh tokens: lifecycle (issue, rotate with reuse detection, revoke) and the
 * own-sessions API (JWT mode, no RBAC: a user without roles manages their own sessions).
 *
 *   npm run test:sessions
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { Server } from "node:http";
import { AddressInfo } from "node:net";
import { App } from "../config/index";
import { sequelize } from "../database/db";
import { assertNoPendingMigrations } from "../database/migrator";
import { sha256Hex } from "../shared/auth/password";
import { RefreshToken } from "../features/auth/refresh-tokens/refresh-token.model";
import { RefreshTokensService } from "../features/auth/refresh-tokens/refresh-tokens.service";
import { createTestIdentity, TestIdentity } from "./support/identity";

type Json = Record<string, unknown>;

let server: Server;
let baseUrl = "";
const tag = Date.now().toString().slice(-6);
const service = new RefreshTokensService();
let owner: TestIdentity;
let other: TestIdentity;

const api = async (method: string, path: string, bearer: string | null) => {
  const headers: Record<string, string> = bearer ? { Authorization: `Bearer ${bearer}` } : {};
  const response = await fetch(`${baseUrl}${path}`, { method, headers });
  const raw = await response.text();
  return { status: response.status, body: JSON.parse(raw) as Json, raw };
};

const statusOf = async (familyId: string) =>
  (await RefreshToken.findAll({ where: { familyId }, order: [["id", "ASC"]] })).map((t) => t.status);

describe("ISS-14 refresh tokens and own sessions", () => {
  before(async () => {
    await assertNoPendingMigrations();
    server = new App().app.listen(0);
    await new Promise<void>((resolve) => server.once("listening", () => resolve()));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
    // No roles: sessions are JWT mode, not grants.
    owner = await createTestIdentity(`test.sess${tag}`, []);
    other = await createTestIdentity(`test.other${tag}`, []);
  });

  after(async () => {
    // Sessions are deleted in cascade with their users.
    await owner.remove();
    await other.remove();
    server.close();
    await sequelize.close();
  });

  it("stores only the SHA-256 of the opaque token", async () => {
    const issued = await service.issue(owner.user.id, "test-agent");
    assert.match(issued.rawToken, /^[A-Za-z0-9_-]{86}$/);
    assert.equal(await RefreshToken.count({ where: { tokenHash: issued.rawToken } }), 0);
    const stored = await RefreshToken.findOne({ where: { tokenHash: sha256Hex(issued.rawToken) } });
    assert.equal(stored?.familyId, issued.familyId);
    assert.equal(stored?.status, "active");
    assert.ok(issued.expiresAt.getTime() > Date.now() + 6 * 24 * 3600 * 1000);
  });

  it("rotates in the same family and revokes the family when a rotated token is reused", async () => {
    const first = await service.issue(owner.user.id, null);
    const rotated = await service.rotate(first.rawToken, "otro-dispositivo");
    assert.equal(rotated.kind, "rotated");
    if (rotated.kind !== "rotated") return;
    assert.equal(rotated.familyId, first.familyId);
    assert.notEqual(rotated.rawToken, first.rawToken);
    assert.deepEqual(await statusOf(first.familyId), ["inactive", "active"]);

    // The old token reappears: theft is assumed and the whole chain dies, the new one too.
    const reuse = await service.rotate(first.rawToken, null);
    assert.deepEqual(reuse, { kind: "reuse", familyId: first.familyId, revoked: 1 });
    assert.deepEqual(await statusOf(first.familyId), ["inactive", "inactive"]);
    assert.equal((await service.rotate(rotated.rawToken, null)).kind, "reuse");
    assert.equal((await service.rotate("no-existe", null)).kind, "invalid");
  });

  it("lets only one of two concurrent refreshes win (row lock)", async () => {
    const issued = await service.issue(owner.user.id, null);
    const outcomes = await Promise.all([service.rotate(issued.rawToken, null), service.rotate(issued.rawToken, null)]);
    assert.deepEqual(outcomes.map((o) => o.kind).sort(), ["reuse", "rotated"]);
    assert.equal(await RefreshToken.count({ where: { familyId: issued.familyId, status: "active" } }), 0);
  });

  it("rejects an expired token and revokes by token idempotently", async () => {
    const expired = await service.issue(owner.user.id, null);
    await RefreshToken.update({ expiresAt: new Date(Date.now() - 1000) }, { where: { familyId: expired.familyId } });
    assert.equal((await service.rotate(expired.rawToken, null)).kind, "expired");
    assert.deepEqual(await statusOf(expired.familyId), ["inactive"]);

    const loggedIn = await service.issue(owner.user.id, null);
    await service.revokeByToken(loggedIn.rawToken);
    await service.revokeByToken(loggedIn.rawToken);
    await service.revokeByToken("no-existe");
    assert.deepEqual(await statusOf(loggedIn.familyId), ["inactive"]);
  });

  it("requires a token (401) but no grant: a user without roles lists only their own sessions", async () => {
    assert.equal((await api("GET", "/sessions", null)).status, 401);
    const mine = await service.issue(owner.user.id, "mio");
    await service.issue(other.user.id, "ajeno");

    const list = await api("GET", "/sessions", owner.token);
    assert.equal(list.status, 200);
    const sessions = list.body.sessions as Json[];
    assert.ok(sessions.length > 0);
    assert.ok(sessions.every((s) => s.userId === owner.user.id && s.status === "active"));
    assert.equal(list.raw.includes("tokenHash"), false);
    assert.equal(list.raw.includes(sha256Hex(mine.rawToken)), false);
  });

  it("reads and revokes only own sessions: another user's id answers 404", async () => {
    const mine = await service.issue(owner.user.id, null);
    const theirs = await service.issue(other.user.id, null);
    const mineId = (await RefreshToken.findOne({ where: { familyId: mine.familyId } }))?.id ?? 0;
    const theirsId = (await RefreshToken.findOne({ where: { familyId: theirs.familyId } }))?.id ?? 0;

    const one = await api("GET", `/sessions/${mineId}`, owner.token);
    assert.deepEqual([one.status, one.body.familyId, one.body.isExpired], [200, mine.familyId, false]);
    assert.equal((await api("GET", "/sessions/abc", owner.token)).status, 400);
    assert.equal((await api("GET", `/sessions/${theirsId}`, owner.token)).status, 404);
    assert.equal((await api("PATCH", `/sessions/${theirsId}/deactivate`, owner.token)).status, 404);
    assert.deepEqual(await statusOf(theirs.familyId), ["active"]);

    const revoked = await api("PATCH", `/sessions/${mineId}/deactivate`, owner.token);
    assert.deepEqual([revoked.status, (revoked.body.session as Json).status], [200, "inactive"]);
    assert.equal((await api("PATCH", `/sessions/${mineId}/deactivate`, owner.token)).status, 200);
    assert.equal((await service.rotate(mine.rawToken, null)).kind, "reuse");
  });

  it("revokes all own sessions and purges the unusable ones", async () => {
    await service.issue(owner.user.id, null);
    const othersBefore = await RefreshToken.count({ where: { userId: other.user.id } });
    const activeBefore = await RefreshToken.count({ where: { userId: owner.user.id, status: "active" } });
    const all = await api("PATCH", "/sessions/deactivate-all", owner.token);
    assert.deepEqual([all.status, all.body.revoked], [200, activeBefore]);
    assert.deepEqual((await api("GET", "/sessions", owner.token)).body.sessions, []);
    assert.equal(await RefreshToken.count({ where: { userId: other.user.id, status: "active" } }), othersBefore);

    const total = await RefreshToken.count({ where: { userId: owner.user.id } });
    const purged = await api("DELETE", "/sessions", owner.token);
    assert.deepEqual([purged.status, purged.body.purged], [200, total]);
    assert.equal(await RefreshToken.count({ where: { userId: owner.user.id } }), 0);
    assert.equal(await RefreshToken.count({ where: { userId: other.user.id } }), othersBefore);
  });
});
