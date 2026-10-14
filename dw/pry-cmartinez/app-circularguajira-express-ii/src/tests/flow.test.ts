/**
 * End-to-end business flow (Phase I, no auth): recycler + material/rates + route ->
 * collection with weighings -> settlement -> verify -> void -> settle again.
 *
 * Runs the real App against the configured database on a random port and goes through
 * the HTTP API only. It creates its own TEST-* data and leaves it deactivated.
 *
 *   npm run test:flow
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { Server } from "node:http";
import { AddressInfo } from "node:net";
import { App } from "../config/index";
import { sequelize } from "../database/db";
import { assertNoPendingMigrations } from "../database/migrator";
import { todayInColombia } from "../features/business/materials/material-rates.service";

type Json = Record<string, unknown>;
interface ApiResponse {
  status: number;
  body: Json;
}

let server: Server;
let baseUrl = "";

const api = async (method: string, path: string, body?: unknown): Promise<ApiResponse> => {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, body: (await response.json()) as Json };
};

const daysAgo = (days: number): string => {
  const date = new Date(`${todayInColombia()}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
};

const idOf = (response: ApiResponse): number => response.body.id as number;
const list = (response: ApiResponse, key: string): Json[] => response.body[key] as Json[];

const tag = Date.now().toString().slice(-8);
const ids = { recycler: 0, material: 0, materialNoRate: 0, route: 0, collection: 0, settlement: 0 };

describe("Phase I business flow: collection -> weighing -> settlement", () => {
  before(async () => {
    await assertNoPendingMigrations();
    server = new App().app.listen(0);
    await new Promise<void>((resolve) => server.once("listening", () => resolve()));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;

    const recycler = await api("POST", "/recyclers", {
      name: `TEST Reciclador ${tag}`,
      documentNumber: `9${tag}`,
      recyclerType: "independent",
      phone: "3001112233",
      status: "active",
    });
    assert.equal(recycler.status, 201);
    ids.recycler = idOf(recycler);

    const material = await api("POST", "/materials", { name: `TEST-PET-${tag}` });
    const materialNoRate = await api("POST", "/materials", { name: `TEST-SINTARIFA-${tag}` });
    assert.equal(material.status, 201);
    ids.material = idOf(material);
    ids.materialNoRate = idOf(materialNoRate);

    const route = await api("POST", "/routes", { name: `TEST Ruta ${tag}`, municipality: "Riohacha" });
    assert.equal(route.status, 201);
    ids.route = idOf(route);
  });

  after(async () => {
    // Leave the TEST-* data out of the active listings.
    await api("PATCH", `/settlements/${ids.settlement}/void`);
    await api("PATCH", `/collections/${ids.collection}/deactivate`);
    await api("PATCH", `/materials/${ids.material}/deactivate`);
    await api("PATCH", `/materials/${ids.materialNoRate}/deactivate`);
    await api("PATCH", `/routes/${ids.route}/deactivate`);
    await api("PATCH", `/recyclers/${ids.recycler}/deactivate`);
    server.close();
    await sequelize.close();
  });

  it("rates: a new period closes the open one and the applicable rate depends on the date", async () => {
    assert.equal((await api("POST", `/materials/${ids.material}/rates`, { pricePerKg: 1000, validFrom: daysAgo(20) })).status, 201);
    assert.equal((await api("POST", `/materials/${ids.material}/rates`, { pricePerKg: 1200, validFrom: daysAgo(5) })).status, 201);

    const history = list(await api("GET", `/materials/${ids.material}/rates`), "rates");
    assert.equal(history[1].validTo, daysAgo(6));
    assert.equal((await api("GET", `/materials/${ids.material}/rates/current?date=${daysAgo(10)}`)).body.pricePerKg, 1000);
    assert.equal((await api("GET", `/materials/${ids.material}/rates/current?date=${daysAgo(30)}`)).status, 404);
  });

  it("collection: net = gross - tare, amount = net x applicable rate, totals derived", async () => {
    const created = await api("POST", "/collections", {
      recyclerId: ids.recycler,
      routeId: ids.route,
      collectedOn: daysAgo(10),
      weighings: [
        { materialId: ids.material, grossKg: 50.5, tareKg: 2 },
        { materialId: ids.material, grossKg: 10.25, tareKg: 0.25 },
      ],
    });
    assert.equal(created.status, 201);
    ids.collection = idOf(created);
    const weighings = list(created, "weighings");
    assert.equal(weighings[0].netKg, 48.5);
    assert.equal(weighings[0].amount, 48500);
    assert.equal(created.body.totalNetKg, 58.5);
    assert.equal(created.body.totalAmount, 58500);
  });

  it("collection: a failing line rolls the whole collection back", async () => {
    const before = list(await api("GET", "/collections"), "collections").length;
    const failed = await api("POST", "/collections", {
      recyclerId: ids.recycler,
      routeId: ids.route,
      collectedOn: daysAgo(10),
      weighings: [
        { materialId: ids.material, grossKg: 20, tareKg: 1 },
        { materialId: ids.materialNoRate, grossKg: 5, tareKg: 0 },
      ],
    });
    assert.equal(failed.status, 404);
    assert.equal(list(await api("GET", "/collections"), "collections").length, before);
  });

  it("invalid input is rejected", async () => {
    const base = { recyclerId: ids.recycler, routeId: ids.route };
    const grossBelowTare = await api("POST", "/collections", { ...base, weighings: [{ materialId: ids.material, grossKg: 1, tareKg: 2 }] });
    const future = await api("POST", "/collections", { ...base, collectedOn: "2999-01-01", weighings: [{ materialId: ids.material, grossKg: 5 }] });
    const empty = await api("POST", "/collections", { ...base, weighings: [] });
    assert.deepEqual([grossBelowTare.status, future.status, empty.status], [400, 400, 400]);
  });

  it("changing the collection date re-prices its weighings", async () => {
    const moved = await api("PATCH", `/collections/${ids.collection}`, { collectedOn: daysAgo(2) });
    assert.equal(moved.status, 200);
    assert.equal(list(moved, "weighings")[0].pricePerKg, 1200);
    assert.equal(moved.body.totalAmount, 70200);
  });

  it("settlement freezes the collection and verifies consistently", async () => {
    const settled = await api("POST", "/settlements", { collectionId: ids.collection, notes: "TEST" });
    assert.equal(settled.status, 201);
    ids.settlement = idOf(settled);
    assert.equal(settled.body.totalAmount, 70200);
    assert.equal(settled.body.lineCount, 2);

    assert.equal((await api("POST", "/settlements", { collectionId: ids.collection })).status, 409);
    const collection = await api("GET", `/collections/${ids.collection}`);
    const firstWeighing = list(collection, "weighings")[0].id as number;
    assert.equal((await api("PATCH", `/weighings/${firstWeighing}`, { tareKg: 1 })).status, 409);

    const verification = await api("GET", `/settlements/${ids.settlement}/verify`);
    assert.equal(verification.body.consistent, true);
  });

  it("voiding reopens the collection; it can be corrected and settled again", async () => {
    assert.equal((await api("DELETE", `/settlements/${ids.settlement}`)).status, 409);
    assert.equal((await api("PATCH", `/settlements/${ids.settlement}/void`)).status, 200);

    const collection = await api("GET", `/collections/${ids.collection}`);
    const firstWeighing = list(collection, "weighings")[0].id as number;
    assert.equal((await api("PATCH", `/weighings/${firstWeighing}`, { tareKg: 0.5 })).status, 200);

    const resettled = await api("POST", "/settlements", { collectionId: ids.collection });
    assert.equal(resettled.status, 201);
    assert.equal(resettled.body.totalAmount, 72000);
    assert.equal((await api("DELETE", `/settlements/${ids.settlement}`)).status, 200);
    ids.settlement = idOf(resettled);
    assert.equal((await api("GET", `/settlements/${ids.settlement}/verify`)).body.consistent, true);
  });

  it("integrity: a recycler with collections cannot be physically deleted", async () => {
    assert.equal((await api("DELETE", `/recyclers/${ids.recycler}`)).status, 409);
  });
});
