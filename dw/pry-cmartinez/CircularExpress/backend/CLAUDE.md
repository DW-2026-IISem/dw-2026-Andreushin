# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

CircularGuajira backend: an Express 5 + TypeScript REST API (Sequelize ORM, multi-engine DB) for traceability of the recycling supply chain in La Guajira, Colombia. Code comments, log messages, docs and API error strings are in Spanish; keep that convention.

The project is built **incrementally, issue by issue**. `docs/prompt.MD` is the master spec (domain model, architecture rules, execution protocol) and `trazabilidad/ISS-00` … `ISS-16` are the work items, each with DoR prerequisites, reference code and DoD checks. Before implementing anything, read the relevant ISS file and confirm its prerequisite issues are done. Placeholder comments like `// ISS-03 §4.3` in the code mark where a future issue plugs in.

Current state: see `MEMORY.md` (it is always up to date; this file only holds stable rules).

## MEMORY.md: project memory cache (mandatory rule)

`MEMORY.md` (in this `backend/` folder) is the shared executive summary that lets any AI or developer pick up the project's current state. Rules:

- **Read `MEMORY.md` first** at the start of every session, before touching code.
- **Update it in the same change whenever code is modified in any way** (new/edited/deleted files, dependencies, scripts, `.env` keys, completed issues, decisions, known problems).
- Keep it at **50 lines maximum**. It's an executive summary: summarize or drop outdated detail instead of appending history.
- Keep its sections: current state/issue progress, implemented structure, decisions and deviations from the ISS specs, pending issues/known problems, next step, and last-update date.
- Write it in Spanish, like the rest of the project docs.

## Issue workflow: skill `issue-flow` (mandatory standard)

Every ISS is started and closed with the project skill `.claude/skills/issue-flow/` (read its `SKILL.md`). Claude runs the whole flow itself; the user only reviews:

- **Start:** check DoR, move the card to *En curso* on GitHub Project 9 (https://github.com/orgs/DW-2026-IISem/projects/9) and comment the plan on the issue.
- **Close:** card to *Verificacion* → run the DoD (`npx tsc --noEmit`, server start, endpoints) → generate PNG evidence with `scripts/evidence.mjs` into `trazabilidad/images/` → update `MEMORY.md` → `git add` **only that issue's files** (explicit paths; never `.env`, `node_modules/`, `dist/` or anything outside `backend/`) → `feat(iss-XX): ...` commit with `Refs #N` → `git push origin main` → write the commit hash, checked criteria and evidence into `trazabilidad/ISS-XX_*.md` (section "4. Cierre y trazabilidad") → `docs(iss-XX): evidencias y cierre de trazabilidad ISS-XX` commit with `Closes #N` → push → `scripts/sync_issue.py ISS-XX`, closing comment on the issue, card to *Hecho*.
- Git root is `/home/andrehau/ia-lab/projects` (branch `main`). GitHub issue numbers don't match ISS numbers; use `scripts/board.sh ISS-XX numero`.
- Messages: Conventional Commits in Spanish, matching repo history (bullet body + `Verificación: ...`).
- **Never** add `Co-Authored-By`, `Claude-Session`, "Generated with Claude Code" or any AI legend to commits, PRs, issues or comments. Check `git log -1 --format=%B` before every push. No `--force`, no `--no-verify`.

## Commands

```bash
npm run dev        # nodemon + ts-node on src/server.ts (default port 4000)
npm run build      # tsc -> dist/
npm start          # node dist/server.js
npx tsc --noEmit   # type-check; this is the per-issue verification step
```

There is no test runner or linter. Verification is done by type-checking, starting the server, and running the REST Client `.http` files under each feature's `http/` folder (e.g. `src/features/business/core/http/health.http`).

The README is ahead of/out of sync with the code: it mentions `tsx`, `npm run seed` (ISS-04 calls it `npm run db:seed`) and `DB_HOST`-style env vars, none of which exist yet. Trust `package.json` and `.env`.

## Architecture

- `src/server.ts` → instantiates `App` from `src/config/index.ts` and calls `listen()`.
- `src/config/index.ts` — `App` class that runs `settings()`, `middlewares()` (morgan, cors, json, urlencoded), `routes()` and `dbConnection()` in its constructor. This is the central place where models are imported, routes are registered, and (per ISS-03) `sequelize.sync({ alter: true })` runs.

Target structure once issues land (see `docs/prompt.MD` §3):

- **Feature modules** in `src/features/business/<feature>/` with files `<feature>.model.ts`, `.controller.ts`, `.routes.ts`, `.associations.ts`, `.seeder.ts`, `.swagger.ts` and an `http/` folder. Multi-word features use kebab-case (`collection-point`, `material-rate`).
- **Every new feature must be wired into the global aggregators**: `src/routes/index.ts` (a `Routes` class holding each `<Feature>Routes` instance), `src/config/index.ts` (model import + `routes()` call + associations), `src/swagger/index.ts`, and `src/database/seeders/index.ts` (with per-table counts in `seeders/counts.ts`).
- **Controller convention**: class with `create`, `getAll`, `getOne`, `updatePut`, `updatePatch`, `deletePhysical`, `deleteLogical`. Logical delete sets `status: "inactive"`; `getAll` returns only active rows. Routes classes expose `routes(app)` and bind controller methods with `.bind(controller)`. No authentication in this phase.
- **Models**: Sequelize `Model` subclass + a `<Entity>I` interface, snake_case columns, explicit `tableName`, `timestamps: true`.
- **Seeders**: idempotent (skip if the table already has rows), using `@faker-js/faker`.
- **Domain**: 11 tables in 4 subsystems: recyclers / routes / collection_points / collections; materials / material_rates; plants / material_lots / weighings; material_sales / settlements. FK relationships and issue order are in the matrix in `docs/prompt.MD` §5.

## Database config

`.env` (git-ignored) selects the engine with `DB_DIALECT` (`mysql | postgres | mssql | oracle`) and reads per-engine blocks `DB_<ENGINE>_HOST/PORT/USERNAME/PASSWORD/NAME`. Only the active engine's block is meant to be required (fail-fast validation). The reference `db.ts` in `ISS-02` uses different names (`DB_ENGINE`, `MYSQL_HOST`, …). When implementing ISS-02, adapt it to the existing `.env` naming instead of rewriting `.env`.
