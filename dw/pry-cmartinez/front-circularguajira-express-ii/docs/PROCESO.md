# Proceso de creación del frontend de CircularGuajira

## Propósito y alcance

Este documento organiza en bloques ISS la construcción del frontend Angular de **CircularGuajira**, que consume la API de `app-circularguajira-express-ii` en `http://localhost:4000/api`. La **Fase I** entrega las pantallas de negocio (recicladores, materiales y tarifas, rutas, pesajes y liquidaciones); la **Fase II** incorpora la sesión JWT y la navegación según los permisos del rol (`ADMIN`, `LOGISTICA`, `BASCULA`, `PLANTA`, `FINANZAS`).

## Criterios técnicos

- Tecnologías: Node.js, Angular 22 (standalone, signals) y TypeScript.
- Código en inglés y camelCase; textos de la interfaz en español.
- Organizar el código por *features* del dominio, con servicios HTTP separados de los componentes.
- Los permisos no se fijan en el frontend: salen de `GET /api/session/permissions`.
- La URL de la API se configura por ambiente; no se guardan secretos en el repositorio.

## Fase I · Business (dominio CircularGuajira)

### ISS-00 — Requisitos previos

Dejar el equipo listo para construir el frontend: Node, npm, Angular CLI, navegador, backend Express corriendo y base de datos sembrada. Al terminar este ISS no se ha escrito código de Angular; solo se comprueba el entorno.

El backend ya está en su estado final (Fase II): las rutas de negocio exigen JWT + RBAC. Login, refresh y logout son OPEN; `GET /api/session/profile` y `GET /api/session/permissions` son JWT. El login devuelve solo el par de tokens; el perfil y los permisos se piden aparte. Usuarios del seeder: `admin`, `logistica`, `bascula`, `planta` y `finanzas` (contraseña `<Rol>2026!`), con 87, 30, 21, 13 y 18 permisos.

WSL ejecuta Node, Angular CLI, el backend y MySQL (Docker); el navegador de Windows abre `http://localhost:<puerto>` porque WSL2 reenvía localhost.

Criterios de aceptación (ISS-00)

- [x] `node -v` cumple los `engines` de `@angular/cli` y `npm -v` responde
- [x] `ng version` identifica Angular CLI 22.x y `command -v ng` apunta a la instalación npm
- [x] `npm run db:seed` termina sin error y `npm run dev` deja el puerto 4000 escuchando
- [x] `POST /api/session/login` con `admin` / `Admin2026!` devuelve `accessToken` y `refreshToken`
- [x] `GET /api/session/permissions` con ese token devuelve `permissions` (87 para admin)
- [x] `logistica`, `bascula`, `planta` y `finanzas` inician sesión y reciben 30, 21, 13 y 18 permisos
- [x] DevTools con Console y Network disponibles para revisar cada petición
- [x] La carpeta del frontend existe y está vacía de código: sin `src/` ni `package.json`; solo `docs/`
- [x] `curl -i http://localhost:4000/api/recyclers` responde 401 (backend final)
- [x] `GET /api/session/profile` (JWT) devuelve el usuario con sus `roles`
- [x] Un usuario sin rol se autentica pero recibe 403 en recursos RBAC
- [x] En Network la petición lleva `Authorization: Bearer ...`

### Pasos

```bash
node --version && npm --version
npm view @angular/cli version engines --json
npm install -g @angular/cli
command -v ng && ng version
cd ~/ia-lab/projects/dw/pry-cmartinez/app-circularguajira-express-ii
npm run db:migrate && npm run db:seed && npm run dev
mkdir -p ~/ia-lab/projects/dw/pry-cmartinez/front-circularguajira-express-ii
```

### Verificación del ISS

```bash
# 1. Versiones
node -v && npm -v && ng version

# 2. Backend vivo (401 = protegido)
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:4000/api/recyclers

# 3. Login + permisos de admin
TOKEN=$(curl -s -X POST http://localhost:4000/api/session/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin","password":"Admin2026!"}' \
  | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

curl -s http://localhost:4000/api/session/permissions \
  -H "Authorization: Bearer $TOKEN" | head -c 300

# 4. Perfil (JWT)
curl -s http://localhost:4000/api/session/profile -H "Authorization: Bearer $TOKEN"

# 5. Permisos de los demás roles
for u in logistica bascula planta finanzas; do
  B='{"identifier":"'$u'","password":"'${u^}'2026!"}'
  T=$(curl -s -X POST http://localhost:4000/api/session/login \
    -H "Content-Type: application/json" -d "$B" \
    | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
  curl -s http://localhost:4000/api/session/permissions \
    -H "Authorization: Bearer $T" | grep -o '"resourceId"' | wc -l
done
```

**Verificación:** versiones correctas, backend protegido en el puerto 4000 (401 sin token), login, perfil y permisos efectivos de los cinco roles; un usuario sin rol recibe 403.

#### Evidencias

**Ev1 — Node y npm:** `node -v && npm -v` devuelve v24.20.0 y 11.19.0; `npm view @angular/cli` pide `node ^22.22.3 || ^24.15.0 || >=26.0.0` y `npm >=8.0.0`.

![Ev1 ISS-00](images/Ev1-ISS-00.png)

**Ev2 — Angular CLI:** `command -v ng` apunta a `~/.nvm/.../bin/ng`, enlace a `@angular/cli/bin/ng.js`; `ng version` reporta Angular CLI 22.2.3.

![Ev2 ISS-00](images/Ev2-ISS-00.png)

**Ev3 — Backend:** `npm run db:migrate && npm run db:seed` concilia 5 roles y 87 recursos; `npm run dev` levanta en el puerto 4000, `/health` responde 200 y el puerto está en LISTEN.

![Ev3 ISS-00](images/Ev3-ISS-00.png)

**Ev4 — Login:** `POST /api/session/login` con `admin` devuelve `accessToken`, `tokenType: Bearer`, `expiresIn: 900`, `refreshToken` y `refreshExpiresIn`.

![Ev4 ISS-00](images/Ev4-ISS-00.png)

**Ev5 — Permisos admin:** con ese token, `GET /api/session/permissions` devuelve filas `{ resourceId, method, path }`, 87 en total.

![Ev5 ISS-00](images/Ev5-ISS-00.png)

**Ev6 — Demás roles:** el ciclo de login + permisos da logistica 30, bascula 21, planta 13 y finanzas 18.

![Ev6 ISS-00](images/Ev6-ISS-00.png)

**Ev7 — DevTools:** Network muestra `login` y `permissions` con 200 y Console imprime `GET /api/session/permissions -> 200, 87 permisos`.

![Ev7 ISS-00](images/Ev7-ISS-00.png)

**Ev8 — Carpeta del frontend:** en el commit `820bc53` de este ISS, `git ls-tree` muestra solo `docs` y ningún `src/` ni `package.json`.

![Ev8 ISS-00](images/Ev8-ISS-00.png)

**Ev9 — Backend protegido:** `curl -i http://localhost:4000/api/recyclers` responde `401 Unauthorized` con "Falta el token de acceso".

![Ev9 ISS-00](images/Ev9-ISS-00.png)

**Ev10 — Perfil:** con el token del admin, `GET /api/session/profile` devuelve `id`, `username`, `email`, `status` y `roles: ["ADMIN"]`.

![Ev10 ISS-00](images/Ev10-ISS-00.png)

**Ev11 — Usuario sin rol:** `homero.7lhgr` (usuario aleatorio del seeder, `Usuario2026!`) inicia sesión, pero tiene `roles: []`, `permissions: []` y `GET /api/recyclers` responde 403.

![Ev11 ISS-00](images/Ev11-ISS-00.png)

**Ev12 — Authorization en Network:** la petición `permissions` (200) muestra en Request Headers `Authorization: Bearer eyJ...`.

![Ev12 ISS-00](images/Ev12-ISS-00.png)

### Commit

```bash
git add docs/PROCESO.md docs/images/Ev1-ISS-00.png docs/images/Ev2-ISS-00.png docs/images/Ev3-ISS-00.png \
  docs/images/Ev4-ISS-00.png docs/images/Ev5-ISS-00.png docs/images/Ev6-ISS-00.png
git commit -m "FRONT-ISS-00: Requisitos previos"
git push origin main
```

Commit: [`820bc53`](https://github.com/DW-2026-IISem/dw-2026-Andreushin/commit/820bc535796b844270434257844df1f83bbb63ad)

Capturas reales de evidencias: [`2b8fc5b`](https://github.com/DW-2026-IISem/dw-2026-Andreushin/commit/2b8fc5b964c31496944f6bbd8cd001e5b4afebe3)

Criterios consolidados de la guía:

```bash
git add docs/PROCESO.md docs/images/Ev1-ISS-00.png docs/images/Ev2-ISS-00.png docs/images/Ev3-ISS-00.png \
  docs/images/Ev4-ISS-00.png docs/images/Ev5-ISS-00.png docs/images/Ev6-ISS-00.png docs/images/Ev7-ISS-00.png \
  docs/images/Ev8-ISS-00.png docs/images/Ev9-ISS-00.png
git commit -m "FRONT-ISS-00: Criterios consolidados de requisitos previos"
git push origin main
```

Commit: [`2adf274`](https://github.com/DW-2026-IISem/dw-2026-Andreushin/commit/2adf274138e969c8b2b23f868176a7527bd22b02)

Sub-ítems de perfil, usuario sin rol y Authorization:

```bash
git add docs/PROCESO.md docs/images/Ev10-ISS-00.png docs/images/Ev11-ISS-00.png docs/images/Ev12-ISS-00.png
git commit -m "FRONT-ISS-00: Perfil, usuario sin rol y Authorization en Network"
git push origin main
```
