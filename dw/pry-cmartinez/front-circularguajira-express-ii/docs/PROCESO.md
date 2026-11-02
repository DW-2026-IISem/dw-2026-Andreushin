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

Criterios de aceptación (ISS-00)

- [x] `node -v` ≥ 22 y `npm -v` ≥ 10
- [x] `npx @angular/cli@22 version` muestra Angular CLI 22.x
- [x] `npm run db:seed && npm run dev` del backend deja el puerto 4000 escuchando
- [x] `POST /api/session/login` con `admin` devuelve `accessToken` y `refreshToken`
- [x] `GET /api/session/permissions` con ese token devuelve `permissions` (87 para admin)
- [x] La carpeta `front-circularguajira-express-ii` existe y está vacía (solo `docs/`)

### Pasos

```bash
node -v && npm -v
npx @angular/cli@22 version
cd ~/ia-lab/projects/dw/pry-cmartinez/app-circularguajira-express-ii
npm run db:migrate && npm run db:seed && npm run dev
mkdir -p ~/ia-lab/projects/dw/pry-cmartinez/front-circularguajira-express-ii
```

### Verificación del ISS

```bash
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:4000/api/recyclers

TOKEN=$(curl -s -X POST http://localhost:4000/api/session/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin","password":"Admin2026!"}' \
  | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

curl -s http://localhost:4000/api/session/permissions \
  -H "Authorization: Bearer $TOKEN" | head -c 300
```

**Verificación:** versiones correctas, backend protegido en el puerto 4000 (401 sin token) y login con permisos efectivos del admin.

#### Evidencias

**Ev1 — Node y npm:** `node -v && npm -v` devuelve v24.20.0 y 11.19.0.

![Ev1 ISS-00](images/Ev1-ISS-00.png)

**Ev2 — Angular CLI:** `npx @angular/cli@22 version`, fuera de un proyecto Angular, reporta Angular CLI 22.2.3 sobre Node 24.20.0.

![Ev2 ISS-00](images/Ev2-ISS-00.png)

**Ev3 — Backend:** `npm run db:migrate && npm run db:seed` concilia 5 roles y 87 recursos, `npm run dev` levanta en el puerto 4000; `/health` responde 200, `/api/recyclers` responde 401 sin token y el puerto 4000 está en LISTEN.

![Ev3 ISS-00](images/Ev3-ISS-00.png)

**Ev4 — Login:** `POST /api/session/login` con `admin` devuelve `accessToken`, `tokenType: Bearer`, `expiresIn: 900`, `refreshToken` y `refreshExpiresIn`.

![Ev4 ISS-00](images/Ev4-ISS-00.png)

**Ev5 — Permisos:** con el token del admin, `GET /api/session/permissions` devuelve filas `{ resourceId, method, path }`, 87 en total.

![Ev5 ISS-00](images/Ev5-ISS-00.png)

**Ev6 — Carpeta del frontend:** en el commit `820bc53` de este ISS, `git ls-tree` muestra que `front-circularguajira-express-ii` solo contiene `docs/`.

![Ev6 ISS-00](images/Ev6-ISS-00.png)

### Commit

```bash
git add docs/PROCESO.md docs/images/Ev1-ISS-00.png docs/images/Ev2-ISS-00.png docs/images/Ev3-ISS-00.png \
  docs/images/Ev4-ISS-00.png docs/images/Ev5-ISS-00.png docs/images/Ev6-ISS-00.png
git commit -m "FRONT-ISS-00: Requisitos previos"
git push origin main
```

Commit: [`820bc53`](https://github.com/DW-2026-IISem/dw-2026-Andreushin/commit/820bc535796b844270434257844df1f83bbb63ad)
