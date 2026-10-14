/**
 * ISS-09 security base: password/token hashing, access JWT, resource matching and the
 * auth model hooks (the last group needs the migrated database).
 *
 *   npm run test:auth
 */
import { after, describe, it } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { sequelize } from "../database/db";
import { assertNoPendingMigrations } from "../database/migrator";
import { generateOpaqueToken, hashPassword, sha256Hex, verifyPassword } from "../shared/auth/password";
import {
  extractBearerToken,
  signAccessToken,
  TOKEN_AUDIENCE,
  TOKEN_ISSUER,
  verifyAccessToken,
} from "../shared/auth/jwt";
import { isOperationGranted, normalizePath, pathMatches } from "../shared/auth/resource-match";
import { UnauthorizedError } from "../shared/errors/httpError";
import "../features/auth/rbac.associations";
import { User } from "../features/auth/users/user.model";
import { Role } from "../features/auth/roles/role.model";
import { Resource } from "../features/auth/resources/resource.model";

const secret = (): string => process.env.JWT_SECRET ?? "";
const rejects401 = (token: string): void => assert.throws(() => verifyAccessToken(token), UnauthorizedError);

describe("password.ts", () => {
  it("hashes with bcrypt cost 12 and verifies", async () => {
    const hashed = await hashPassword("Bascula2026!");
    assert.match(hashed, /^\$2[aby]\$12\$/);
    assert.equal(await verifyPassword("Bascula2026!", hashed), true);
    assert.equal(await verifyPassword("otra-clave", hashed), false);
  });

  it("sha256Hex is deterministic and opaque tokens are random and URL-safe", () => {
    assert.equal(sha256Hex("abc"), sha256Hex("abc"));
    assert.match(sha256Hex("abc"), /^[0-9a-f]{64}$/);
    const token = generateOpaqueToken();
    assert.match(token, /^[A-Za-z0-9_-]{86}$/);
    assert.notEqual(token, generateOpaqueToken());
  });
});

describe("jwt.ts", () => {
  it("signs HS256 with sub, username, iss, aud, exp and jti and verifies it", () => {
    const { token, expiresIn } = signAccessToken({ id: 7, username: "bascula1" });
    const header = JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString()) as { alg: string };
    const payload = verifyAccessToken(token);
    assert.equal(header.alg, "HS256");
    assert.equal(payload.sub, "7");
    assert.equal(payload.username, "bascula1");
    assert.equal(payload.iss, TOKEN_ISSUER);
    assert.equal(payload.aud, TOKEN_AUDIENCE);
    assert.equal((payload.exp ?? 0) - (payload.iat ?? 0), expiresIn);
    assert.match(payload.jti, /^[0-9a-f-]{36}$/);
  });

  it("rejects tampered, foreign, unsigned, expired and incomplete tokens with 401", () => {
    const { token } = signAccessToken({ id: 7, username: "bascula1" });
    const [h, p, s] = token.split(".");
    rejects401(`${h}.${p}.${s.slice(0, -2)}xx`);
    rejects401(jwt.sign({ username: "x" }, "otro-secreto-de-mas-de-32-caracteres!!", { subject: "7", jwtid: "j", issuer: TOKEN_ISSUER, audience: TOKEN_AUDIENCE }));
    rejects401(jwt.sign({ username: "x" }, "", { algorithm: "none", subject: "7", jwtid: "j", issuer: TOKEN_ISSUER, audience: TOKEN_AUDIENCE }));
    rejects401(jwt.sign({ username: "x" }, secret(), { subject: "7", jwtid: "j", issuer: TOKEN_ISSUER, audience: "otra-api" }));
    rejects401(jwt.sign({ username: "x", exp: Math.floor(Date.now() / 1000) - 60 }, secret(), { subject: "7", jwtid: "j", issuer: TOKEN_ISSUER, audience: TOKEN_AUDIENCE }));
    rejects401(jwt.sign({ username: "x" }, secret(), { subject: "7", issuer: TOKEN_ISSUER, audience: TOKEN_AUDIENCE }));
    rejects401(jwt.sign({ username: "x" }, secret(), { subject: "abc", jwtid: "j", issuer: TOKEN_ISSUER, audience: TOKEN_AUDIENCE }));
  });

  it("extracts only well-formed Bearer headers", () => {
    assert.equal(extractBearerToken("Bearer abc.def.ghi"), "abc.def.ghi");
    assert.equal(extractBearerToken("bearer abc"), "abc");
    assert.equal(extractBearerToken("Basic abc"), null);
    assert.equal(extractBearerToken("Bearer"), null);
    assert.equal(extractBearerToken(undefined), null);
  });
});

describe("resource-match.ts", () => {
  it("normalizes paths", () => {
    assert.equal(normalizePath("/api//collections/42/?page=2"), "/api/collections/42");
    assert.equal(normalizePath("/"), "/");
  });

  it("matches :param segments strictly", () => {
    assert.equal(pathMatches("/api/collections/:id", "/api/collections/42"), true);
    assert.equal(pathMatches("/api/collections/:id", "/api/collections"), false);
    assert.equal(pathMatches("/api/collections", "/api/collections/42"), false);
    assert.equal(pathMatches("/api/collections/:id", "/api/collections/42/deactivate"), false);
  });

  it("grants only an explicit (method, path): deny by default", () => {
    const granted = [{ method: "POST", path: "/api/weighings" }, { method: "GET", path: "/api/weighings/:id" }];
    assert.equal(isOperationGranted(granted, "post", "/api/weighings"), true);
    assert.equal(isOperationGranted(granted, "GET", "/api/weighings/9"), true);
    assert.equal(isOperationGranted(granted, "DELETE", "/api/weighings/9"), false);
    assert.equal(isOperationGranted([], "GET", "/api/weighings"), false);
  });
});

describe("auth models (migrated database)", () => {
  const tag = Date.now().toString().slice(-8);
  const created: Array<{ destroy: () => Promise<void> }> = [];

  after(async () => {
    for (const row of created.reverse()) await row.destroy();
    await sequelize.close();
  });

  it("User stores only a bcrypt hash, normalizes and never serializes the password", async () => {
    await assertNoPendingMigrations();
    const user = await User.create({ username: `  Test.User${tag} `, email: `TEST${tag}@CircularGuajira.co`, password: "Planta2026!", status: "active" });
    created.push(user);
    assert.equal(user.username, `test.user${tag}`);
    assert.equal(user.email, `test${tag}@circularguajira.co`);
    assert.match(user.password, /^\$2[aby]\$12\$/);
    assert.equal(await verifyPassword("Planta2026!", user.password), true);
    assert.equal("password" in user.toJSON(), false);

    await user.update({ password: "Nueva2026!" });
    assert.equal(await verifyPassword("Nueva2026!", (await User.findByPk(user.id))?.password ?? ""), true);
  });

  it("Role is uppercased and Resource (method, path) is normalized and unique", async () => {
    const role = await Role.create({ name: ` bascula_${tag} `, status: "active" });
    created.push(role);
    assert.equal(role.name, `BASCULA_${tag}`);

    const resource = await Resource.create({ method: "post", path: `/api/test-${tag}//weighings/`, status: "active" });
    created.push(resource);
    assert.deepEqual([resource.method, resource.path], ["POST", `/api/test-${tag}/weighings`]);
    await assert.rejects(Resource.create({ method: "POST", path: `/api/test-${tag}/weighings` }), { name: "SequelizeUniqueConstraintError" });
  });
});
