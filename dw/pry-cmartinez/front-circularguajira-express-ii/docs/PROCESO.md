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

Commit: [`89ba2b1`](https://github.com/DW-2026-IISem/dw-2026-Andreushin/commit/89ba2b18db06c2b6670b148daf5e473f8746c5e7)

### ISS-01 — Bootstrap Angular 22 con CLI

Crear el proyecto con el Angular CLI actual sin carpeta adicional, integrar Tailwind y PrimeNG compatibles y dejar el tema Aura funcionando. Al final `ng serve` muestra la pantalla inicial sin errores. App compone un único componente de aprendizaje, `demo/example`: un objeto `Material` en un `signal`, dos `computed` y un `effect` (equivalente al producto con IVA de la guía: aquí el valor liquidado es tarifa × peso neto).

El tema Aura de PrimeNG pinta los controles (variables CSS generadas en runtime); las utilidades Tailwind resuelven espacio, tipografía y color en el HTML. El orden de capas `theme, base, primeng, utilities` hace que Tailwind gane sin `!important`.

Criterios de aceptación (ISS-01)

- [x] Existen `angular.json`, `package.json`, `src/main.ts` y `src/app/app.config.ts` directamente en la carpeta del proyecto (sin subcarpeta)
- [x] `src/app/app.routes.ts` existe con `export const routes` y `provideRouter` está en `app.config.ts`
- [x] `npm ls primeng @primeuix/themes primeicons @angular/cdk --depth=0` muestra versiones compatibles con Angular 22; `package-lock.json` se conserva
- [x] `src/styles.css` declara el orden de capas e importa `tailwindcss` y `primeicons/primeicons.css`
- [x] `providePrimeNG` usa el preset Aura y `darkModeSelector: '.app-dark'`
- [x] `providePrimeNG` lee `environment.primeUiLicense` y se entiende el aviso Invalid PrimeUI License
- [x] `app.ts` importa `Example` y `app.html` contiene `<app-example />`; `app.css` queda vacío; `app.routes.ts` sigue vacío
- [x] Existe el componente `src/app/demo/example/` (`.ts`, `.html`, `.css`, `.spec.ts`) con un objeto en un `signal`
- [x] `index.html` tiene `<title>CircularGuajira Express II · Angular 22</title>`, `lang="es"` y `<body class="m-0 bg-slate-100 font-sans text-slate-900">`
- [x] El presupuesto `initial` de producción es 750kB / 1MB
- [x] `ng serve` compila sin errores y `http://localhost:4200` responde 200
- [x] En pantalla se ve la tarjeta del material; +100 cambia la tarifa y el valor liquidado sin recargar
- [x] Explica el arranque `index.html` → `main.ts` → `app.config.ts` → App → `<app-example />` → `demo/example` y la función de los cuatro archivos de un componente
- [x] Explica cómo el selector del componente se convierte en la etiqueta que se escribe en `app.html`
- [x] Distingue `signal`, `computed` y `effect` sobre el código real de `demo/example/example.ts`
- [x] Explica el aislamiento de estilos con la clase `.example-scope` de `example.css` y el atributo `_ngcontent-…`
- [x] La consola del navegador no muestra errores de código; `[PrimeUI] PrimeUI license is not configured` está identificado como aviso de licencia
- [x] La consola del navegador no muestra errores de dependencias ni de tema
- [x] `ng build` termina con código 0

### Pasos

```bash
cd ~/ia-lab/projects/dw/pry-cmartinez/front-circularguajira-express-ii
ng new front-circularguajira-express-ii --directory . --style=tailwind --routing \
  --ssr=false --skip-git --package-manager=npm --defaults
npm install
npm view primeng version peerDependencies --json
npm install primeng @primeuix/themes primeicons @angular/cdk
ng generate environments
ng generate component demo/example
# styles.css, app.config.ts, environment*.ts, app.ts/html/css/spec, app.routes.ts,
# index.html, README.md y presupuesto initial en angular.json
npm start
```

### Verificación del ISS

```bash
ng build
grep -R "providePrimeNG\|@import 'tailwindcss'" src | head
npm ls primeng @primeuix/themes primeicons @angular/cdk --depth=0
node -e "const a=require('./angular.json');const p=a.projects[Object.keys(a.projects)[0]];console.log(p.architect.build.configurations.production.budgets[0])"
cat src/styles.css
grep -n "imports: \[Example\]" src/app/app.ts
grep -n "app-example" src/app/app.html
grep -n "signal<\|computed(\|effect(" src/app/demo/example/example.ts
npm test -- --watch=false
```

**Verificación:** `ng serve` muestra la tarjeta del material con Tailwind y Aura activos; +100 cambia la tarifa y el valor liquidado sin recargar, el estado alterna el mensaje y el presupuesto está ajustado.

#### Evidencias

**Ev1 — Proyecto en la carpeta:** los cinco archivos clave están en la raíz del proyecto, sin subcarpeta.

![Ev1 ISS-01](images/Ev1-ISS-01.png)

**Ev2 — Rutas:** `app.routes.ts` exporta `routes: Routes = []` y `app.config.ts` usa `provideRouter`.

![Ev2 ISS-01](images/Ev2-ISS-01.png)

**Ev3 — PrimeNG:** `primeng@22.1.4`, `@primeuix/themes@3.1.0`, `primeicons@8.0.2`, `@angular/cdk@22.2.5`; los peers de PrimeNG piden `@angular/* ^22.1.0` y existe `package-lock.json`.

![Ev3 ISS-01](images/Ev3-ISS-01.png)

**Ev4 — Estilos globales:** `styles.css` declara `@layer theme, base, primeng, utilities;` e importa `tailwindcss` y `primeicons`.

![Ev4 ISS-01](images/Ev4-ISS-01.png)

**Ev5 — Tema:** `providePrimeNG` con `preset: Aura`, `darkModeSelector: '.app-dark'` y `cssLayer` `primeng`.

![Ev5 ISS-01](images/Ev5-ISS-01.png)

**Ev6 — Licencia:** `license: environment.primeUiLicense || undefined`; `primeUiLicense: ''` en ambos environments y `fileReplacements` para desarrollo. Sin clave aparece la banda Invalid PrimeUI License (Ev12).

![Ev6 ISS-01](images/Ev6-ISS-01.png)

**Ev7 — Composición:** `app.ts` importa `Example`, `app.html` contiene `<app-example />`, `app.css` solo tiene un comentario y `routes` sigue vacío.

![Ev7 ISS-01](images/Ev7-ISS-01.png)

**Ev8 — Componente de ejemplo:** `demo/example` tiene sus cuatro archivos y `material = signal<Material>(createInitialMaterial())`.

![Ev8 ISS-01](images/Ev8-ISS-01.png)

**Ev9 — index.html:** `lang="es"`, título, meta description y `<body class="m-0 bg-slate-100 font-sans text-slate-900">`.

![Ev9 ISS-01](images/Ev9-ISS-01.png)

**Ev10 — Presupuesto:** `initial` con `maximumWarning: "750kB"` y `maximumError: "1MB"`.

![Ev10 ISS-01](images/Ev10-ISS-01.png)

**Ev11 — ng serve:** `npm start` compila y `GET http://localhost:4200` responde 200 con el título del proyecto.

![Ev11 ISS-01](images/Ev11-ISS-01.png)

**Ev12 — Pantalla tras +100:** tarjeta «Objeto material» con tarifa 1900 y valor liquidado 19000, etiqueta Activo, las tarjetas Signals y Estilos y la banda de licencia.

![Ev12 ISS-01](images/Ev12-ISS-01.png)

**Ev13 — Arranque:** `index.html` (`<app-root>`) → `main.ts` (`bootstrapApplication`) → `app.config.ts` (providers) → `app.ts` (`imports: [Example]`) → `app.html` (`<app-example />`) → `demo/example` (`.ts` clase, `.html` vista, `.css` estilos privados, `.spec.ts` prueba).

![Ev13 ISS-01](images/Ev13-ISS-01.png)

**Ev14 — Selector a etiqueta:** `selector: 'app-example'` en `example.ts` más `imports: [Example]` en `app.ts` hacen que `<app-example />` de `app.html` pinte el componente; `host: { class: 'block' }` da la clase al anfitrión.

![Ev14 ISS-01](images/Ev14-ISS-01.png)

**Ev15 — signal, computed y effect:** `material` es el estado (`signal`), `settlementValue` y `statusLabel` se derivan (`computed`), `logger` registra en consola (`effect`); los métodos usan `update` con `{ ...current }` o `set`, sin mutar el objeto. Sin Zone.js: el signal avisa a la vista.

![Ev15 ISS-01](images/Ev15-ISS-01.png)

**Ev16 — Encapsulamiento:** `example.css` define `.example-scope` y el build la emite como `.example-scope[_ngcontent-%COMP%]`, que solo afecta a `<app-example>`.

![Ev16 ISS-01](images/Ev16-ISS-01.png)

**Ev17 — Consola:** Chromium carga la app y registra 0 errores, el aviso `[PrimeUI] PrimeUI license is not configured` y los logs del `effect` 1800 → 1900 tras +100.

![Ev17 ISS-01](images/Ev17-ISS-01.png)

**Ev18 — Tema cargado:** `--p-primary-color` vale `light-dark(#10b981,#34d399)` en runtime (Aura) y la consola no tiene errores de dependencias ni de tema.

![Ev18 ISS-01](images/Ev18-ISS-01.png)

**Ev19 — Build y pruebas:** `ng build` termina con código 0 (Initial total 602.96 kB, sin warning) y `ng test` aprueba 7 pruebas (3 de App + 4 del ejemplo).

![Ev19 ISS-01](images/Ev19-ISS-01.png)

### Commit

```bash
git add .editorconfig .gitignore .postcssrc.json .prettierrc .vscode README.md angular.json \
  package.json package-lock.json tsconfig.json tsconfig.app.json tsconfig.spec.json public src \
  docs/PROCESO.md docs/images/Ev*-ISS-01.png
git commit -m "FRONT-ISS-01: Bootstrap Angular 22 con CLI"
git push origin main
```

Commit: [`64b8292`](https://github.com/DW-2026-IISem/dw-2026-Andreushin/commit/64b829293197dfa27324ea478fe6fe38318a5632)

### ISS-01A — Esqueleto Header / Aside / contenido / Footer

Construir primero la pantalla: Header arriba, Aside a la izquierda del contenido y Footer abajo a todo el ancho, con datos fijos y sin llamadas a la API. Los tres componentes de `layout/` son de presentación: no inyectan servicios ni conocen permisos. `demo/example` deja de componerse y queda solo como material de consulta del ISS-01.

Un componente generado no se ve hasta que el padre lo declara en `imports` (paso 1) y escribe su selector como etiqueta en su plantilla (paso 2).

Criterios de aceptación (ISS-01A)

- [x] Explica por qué un componente generado no aparece hasta que el padre lo declara en `imports` y usa su selector
- [x] Existen `src/app/layout/header/`, `src/app/layout/aside/` y `src/app/layout/footer/`, cada una con `.ts`, `.html` y `.css`
- [x] `header.ts` declara `title` y `header.html` lo muestra con `{{ title }}`
- [x] Los tres `.css` de `layout/` no contienen reglas: solo un comentario que explica por qué están vacíos
- [x] `app.ts` importa `Header`, `Aside` y `Footer` y los declara en `imports`
- [x] `app.html` compone las cuatro regiones: `<app-header />`, `<aside>` con `<app-aside />`, `<main>` con el contenido y `<app-footer />`
- [x] `app.html` ya no contiene `<app-example />`: `demo/example` no forma parte de la aplicación
- [x] Se ven las cuatro regiones, el Footer queda abajo y no hay desplazamiento horizontal
- [x] En Network no aparece ninguna petición `/api`
- [x] `ng build` termina con código 0 y las pruebas pasan

### Pasos

```bash
ng generate component layout/header --skip-tests --defaults
ng generate component layout/aside --skip-tests --defaults
ng generate component layout/footer --skip-tests --defaults
# header.ts/html, aside.ts/html, footer.ts/html, los tres .css con comentario,
# app.ts (imports: [Header, Aside, Footer]), app.html (cuatro regiones) y app.spec.ts
npm start
```

### Verificación del ISS

```bash
ng build
ls src/app/layout/header src/app/layout/aside src/app/layout/footer
grep -n "imports: \[Header, Aside, Footer\]" src/app/app.ts
grep -n "app-header\|app-aside\|app-footer" src/app/app.html
grep -c "app-example" src/app/app.html || echo "no aparece: correcto"
grep -v "^\s*$" src/app/layout/*/*.css | grep -v "^\S*: \*\|/\*\|^\S*:  \*" || echo "sin reglas: correcto"
npm test -- --watch=false
```

**Verificación:** la pantalla tiene las cuatro regiones, el Footer se mantiene abajo, no hay scroll horizontal y la aplicación no depende de la API.

#### Evidencias

**Ev1 — imports + selector:** `app.ts` declara `imports: [Header, Aside, Footer]`, cada componente tiene su `selector` (`app-header`, `app-aside`, `app-footer`) y `app.html` escribe esas etiquetas; sin uno de los dos pasos el componente no se pinta.

![Ev1 ISS-01A](images/Ev1-ISS-01A.png)

**Ev2 — layout/:** `header/`, `aside/` y `footer/` tienen `.ts`, `.html` y `.css` (generados con `--skip-tests`).

![Ev2 ISS-01A](images/Ev2-ISS-01A.png)

**Ev3 — Header:** `readonly title = 'CircularGuajira Express II'` y `header.html` lo muestra con `{{ title }}`.

![Ev3 ISS-01A](images/Ev3-ISS-01A.png)

**Ev4 — CSS vacíos:** los tres `.css` solo tienen un comentario; el filtro de la verificación responde «sin reglas: correcto».

![Ev4 ISS-01A](images/Ev4-ISS-01A.png)

**Ev5 — Imports de App:** `app.ts` importa `Aside`, `Footer` y `Header` y los declara en `imports`.

![Ev5 ISS-01A](images/Ev5-ISS-01A.png)

**Ev6 — Composición:** `app.html` con `<app-header />`, `<aside class="w-64 shrink-0">` con `<app-aside />`, `<main id="content" class="min-w-0 flex-1 p-6 wrap-break-word">` y `<app-footer />`.

![Ev6 ISS-01A](images/Ev6-ISS-01A.png)

**Ev7 — Sin demo:** `grep -c 'app-example' src/app/app.html` da 0.

![Ev7 ISS-01A](images/Ev7-ISS-01A.png)

**Ev8 — Pantalla:** Header blanco con CircularGuajira Express II, Aside oscuro con Menú de CircularGuajira, contenido Inicio / Bienvenido a CircularGuajira. y Footer abajo a todo el ancho.

![Ev8 ISS-01A](images/Ev8-ISS-01A.png)

**Ev9 — Medidas y Network:** sobre el build servido en `localhost:4300`, Header 64 px, Aside 256 px, `main` desde x = 256, Footer termina en 900 = alto de la ventana y `scrollWidth = clientWidth` a 1280 y a 390 px; ninguna respuesta `/api` y 0 errores de consola.

![Ev9 ISS-01A](images/Ev9-ISS-01A.png)

**Ev10 — Build y pruebas:** `ng build` termina con código 0 (Initial total 415.81 kB) y `ng test` aprueba 8 pruebas (4 de App + 4 del ejemplo).

![Ev10 ISS-01A](images/Ev10-ISS-01A.png)

### Commit

```bash
git add src/app/app.ts src/app/app.html src/app/app.spec.ts src/app/layout \
  docs/PROCESO.md docs/images/Ev*-ISS-01A.png
git commit -m "FRONT-ISS-01A: Esqueleto Header / Aside / contenido / Footer"
git push origin main
```

Commit: [`48a2c32`](https://github.com/DW-2026-IISem/dw-2026-Andreushin/commit/48a2c326281f845c42fce9bf0c118d638c82b080)

### ISS-01B — Menú PrimeNG y primera interacción

Pasar de una maqueta a una pantalla que responde: PanelMenu en el Aside, botón de menú en el Header, Drawer en pantalla pequeña y selección que cambia el contenido local. Sin rutas de negocio y sin API. La pantalla es `features/prototype` (equivale a `construir` de la guía) y las cinco opciones son las del dominio: Inicio, Recicladores, Materiales y tarifas, Rutas de recolección y Pesajes y liquidaciones.

`input()` es el dato que el padre entrega al hijo (`items`, `appName`); `output()` es el aviso que el hijo devuelve al padre (`menuRequested`, `navigated`); `signal()` es el estado propio de la pantalla (`title`, `mobileOpen`, `sidebarCollapsed`). `[(visible)]` en el Drawer es ida y vuelta en un solo atributo.

Criterios de aceptación (ISS-01B)

- [x] Explica la diferencia entre `input()` (dato del padre al hijo), `output()` (aviso del hijo al padre) y `signal()` (estado propio)
- [x] `aside.ts` declara `items = input<MenuItem[]>([])` y `aside.html` lo pinta con `<p-panelmenu [model]="items()" [multiple]="true" />`
- [x] `aside.css` sigue sin reglas: la apariencia es de Aura y Tailwind
- [x] El Header emite `menuRequested` y su botón está siempre visible: por debajo de `lg` abre el Drawer, desde `lg` alterna el Aside fijo
- [x] Existe `src/app/features/prototype/` con `prototype.ts`, `prototype.html`, `prototype.css` y `prototype.spec.ts`
- [x] `mobileOpen`, `sidebarCollapsed` y `title` son `signal`; elegir una opción cambia el título y cierra el Drawer
- [x] El layout se compone una sola vez en `prototype.html` y se reutiliza en el Drawer
- [x] `app.ts` importa `RouterOutlet` y `app.html` contiene solo `<router-outlet />`
- [x] `app.routes.ts` declara `prototype` con `loadComponent` y redirige `''` y `**` a `prototype`
- [x] A 1280 px se ve el Aside con las cinco opciones; a 390 px se oculta y el botón abre el Drawer
- [x] A 1280 px el botón de menú se ve y oculta/muestra el Aside sin abrir el Drawer
- [x] La URL no cambia al elegir una opción y Network no registra llamadas `/api`
- [x] `ng build` termina con código 0, `prototype` se empaqueta como chunk diferido y las pruebas pasan

### Pasos

```bash
ng generate component features/prototype --skip-tests --defaults
# core/utils/media-query.ts (watchMediaQuery), aside.ts/html (input/output + p-panelmenu),
# header.ts/html (menuRequested), prototype.ts/html/css/spec (estado y Drawer),
# app.ts/html (RouterOutlet), app.routes.ts (loadComponent) y public/brand/circularguajira-mark.svg
npm start
```

### Verificación del ISS

```bash
ng build
grep -n "input<MenuItem\[\]>" src/app/layout/aside/aside.ts
grep -n "menuRequested" src/app/layout/header/header.ts
grep -rn "lg:hidden" src/app/layout/header/header.html || echo "sin lg:hidden: correcto"
grep -n "signal(" src/app/features/prototype/prototype.ts
grep -n "app-header\|app-aside\|app-footer\|p-drawer" src/app/features/prototype/prototype.html
grep -n "RouterOutlet" src/app/app.ts
grep -n "loadComponent" src/app/app.routes.ts
for f in src/app/layout/*/*.css src/app/features/prototype/*.css; do
  grep -q '[{}]' "$f" && echo "REGLAS EN $f"
done
npm test -- --watch=false
```

**Verificación:** el Aside pinta el menú que recibe, el Header avisa sin conocer el estado ajeno, el Drawer funciona en móvil y App quedó como punto de entrada con `router-outlet`. No hay llamadas a la API y los CSS de `layout/` y `prototype/` siguen vacíos.

#### Evidencias

**Ev1 — input, output y signal:** Aside y Header solo declaran `input()` y `output<void>()`; `prototype.ts` tiene los tres `signal`; en `prototype.html` viajan `[items]` hacia abajo y vuelven `(menuRequested)` y `(navigated)`, más `[(visible)]` en el Drawer.

![Ev1 ISS-01B](images/Ev1-ISS-01B.png)

**Ev2 — Aside:** `items = input<MenuItem[]>([])` y `<p-panelmenu [model]="items()" [multiple]="true" />`.

![Ev2 ISS-01B](images/Ev2-ISS-01B.png)

**Ev3 — CSS sin reglas:** el ciclo sobre los `.css` de `layout/` y `prototype/` no imprime ningún «REGLAS EN».

![Ev3 ISS-01B](images/Ev3-ISS-01B.png)

**Ev4 — Botón de menú:** `menuRequested = output<void>()` y el botón lo emite; no hay `lg:hidden`; `onMenuToggle` alterna `sidebarCollapsed` en escritorio y abre `mobileOpen` en móvil.

![Ev4 ISS-01B](images/Ev4-ISS-01B.png)

**Ev5 — features/prototype:** `prototype.ts`, `prototype.html`, `prototype.css` y `prototype.spec.ts`.

![Ev5 ISS-01B](images/Ev5-ISS-01B.png)

**Ev6 — Estado:** `sidebarCollapsed`, `mobileOpen` y `title` son `signal`; los cinco `command` llaman a `select`, que hace `title.set(title)` y `mobileOpen.set(false)`.

![Ev6 ISS-01B](images/Ev6-ISS-01B.png)

**Ev7 — Layout una vez:** `prototype.html` compone `app-header`, `app-aside` y `app-footer`, y el `p-drawer` reutiliza el mismo `<app-aside [items]="items">`.

![Ev7 ISS-01B](images/Ev7-ISS-01B.png)

**Ev8 — Punto de entrada:** `app.ts` importa `RouterOutlet` y `app.html` solo contiene `<router-outlet />`.

![Ev8 ISS-01B](images/Ev8-ISS-01B.png)

**Ev9 — Rutas:** `prototype` con `loadComponent`, `''` con `pathMatch: 'full'` y `**` redirigen a `prototype`.

![Ev9 ISS-01B](images/Ev9-ISS-01B.png)

**Ev10 — Escritorio y móvil:** a 1280 px el Aside fijo muestra logo y las cinco opciones; a 390 px el Aside no se ve y el botón abre el Drawer con las mismas cinco opciones.

![Ev10 ISS-01B](images/Ev10-ISS-01B.png)

**Ev11 — Botón en escritorio:** a 1280 px el Aside mide 288 px; el primer clic lo quita del DOM (`sin aside`) sin abrir Drawer y el segundo lo devuelve.

![Ev11 ISS-01B](images/Ev11-ISS-01B.png)

**Ev12 — Móvil, URL y Network:** a 390 px el Aside no se ve, el botón abre el Drawer, «Recicladores» cambia el `<h1>` y cierra el Drawer; la URL sigue en `/prototype` y no hay respuestas `/api`.

![Ev12 ISS-01B](images/Ev12-ISS-01B.png)

**Ev13 — Build y pruebas:** `ng build` termina con código 0, `main` 117.15 kB y `prototype` como chunk diferido de 226.62 kB; `ng test` aprueba 13 pruebas en 3 archivos.

![Ev13 ISS-01B](images/Ev13-ISS-01B.png)

### Commit

```bash
git add src/app/app.ts src/app/app.html src/app/app.routes.ts src/app/app.spec.ts \
  src/app/layout/aside src/app/layout/header src/app/features/prototype src/app/core \
  public/brand docs/PROCESO.md docs/images/Ev*-ISS-01B.png
git commit -m "FRONT-ISS-01B: Menú PrimeNG y primera interacción"
git push origin main
```
