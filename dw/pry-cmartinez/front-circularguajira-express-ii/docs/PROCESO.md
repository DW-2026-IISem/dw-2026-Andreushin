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

Commit: [`1bcce95`](https://github.com/DW-2026-IISem/dw-2026-Andreushin/commit/1bcce9522bb2bd9160264aa18351217bebb981f6)

### ISS-02 — Núcleo: environment, modelos, servicios y layout

Dejar lista la capa de infraestructura antes de las pantallas de negocio: `environment` con la URL del backend, interfaces que reflejan el contrato real de Express, servicios HTTP que devuelven `Observable<T>` ya desenvuelto, utilidades transversales, componentes de UI reutilizables y el layout `Shell`. Todavía no hay ninguna petición HTTP real.

El contrato se tomó del backend, no de la guía de StoreLab: campos en camelCase, listas envueltas en plural (`{ recyclers }`, `{ points }`, `{ rates }`, `{ assignments }`, `{ grants }`), un solo elemento sin envoltura y errores `{ message }`. Cadena: plantilla → componente → `RecyclerApi` → `GET /api/recyclers` → Express responde `{ recyclers: [...] }` → `pipe(map)` del servicio devuelve `Recycler[]` → el componente lo guarda en un `signal`. La respuesta se desenvuelve en el servicio.

Criterios de aceptación (ISS-02)

- [x] `environment.apiUrl === 'http://localhost:4000/api'`, sin slash final
- [x] `environment.ts` y `environment.development.ts` existen y `angular.json` aplica `fileReplacements`
- [x] Los 15 modelos compilan y coinciden campo a campo con los modelos del backend
- [x] `Money` acepta `number | string` y `toNumber()` normaliza DECIMAL
- [x] `status` no viaja en los payload de edición: solo el backend lo cambia con `/deactivate`
- [x] Cada servicio usa `this.base` construido desde `environment.apiUrl`
- [x] `list()` desenvuelve la colección (`{ recyclers }` → `Recycler[]`) y `get()`/`create()` devuelven la entidad tal como llega
- [x] Las envolturas pivote son `{ assignments }` y `{ grants }`, no `{ role_users }`
- [x] `toApiMessage` distingue `status === 0` (backend caído) de un 403
- [x] `NotificationService` traduce a `MessageService` con duraciones por severidad
- [x] `PageHeader`, `EmptyState` y `StatusTag` compilan como standalone y no añaden CSS
- [x] `StatusTag` se repinta al cambiar el input gracias a `computed`
- [x] `Shell` compone Header/aside/router-outlet/Footer una sola vez; el botón del Header alterna el Aside en escritorio y abre el Drawer en móvil
- [x] `app.routes.ts` carga `Shell` con `loadComponent` y conserva el prototipo
- [x] `provideHttpClient()` está registrado y no hay interceptores de sesión
- [x] `ng build` termina con código 0 y `shell` aparece como chunk diferido
- [x] Las pruebas pasan: 10 archivos, 33 casos

### Pasos

```bash
ng generate component shared/ui/page-header --skip-tests --defaults
ng generate component shared/ui/empty-state --skip-tests --defaults
ng generate component shared/ui/status-tag --skip-tests --defaults
ng generate component layout/shell --skip-tests --defaults
# environment*.ts (production, appName, apiUrl, requireAuth, primeUiLicense)
# core/models/*.model.ts (15), features/*/*-api.ts (12), core/utils/api-error.ts,
# core/services/notification.ts, shared/ui, layout/shell, app.routes.ts y provideHttpClient()
# vitest-base.config.ts (maxWorkers: 2) enlazado en angular.json → test → runnerConfig
```

### Verificación del ISS

```bash
ng build
grep -n "apiUrl" src/environments/environment.ts src/environments/environment.development.ts
ls src/app/core/models/*.model.ts
grep -rn "\.pipe(map" src/app/features src/app/core | wc -l
grep -n "provideHttpClient" src/app/app.config.ts
grep -rn "withInterceptors" src/app/app.config.ts || echo "sin interceptores: correcto"
grep -n "assignments\|grants" src/app/features/admin/*/*-api.ts
for f in src/app/shared/ui/*/*.css src/app/layout/shell/shell.css; do
  grep -q '[{}]' "$f" && echo "REGLAS EN $f"
done
npm test -- --watch=false
```

**Verificación:** una URL de backend, 15 modelos que reflejan las tablas, 12 servicios que desenvuelven la respuesta de Express, dos utilidades transversales, tres componentes de UI y un `Shell` que conserva el layout al navegar; sin llamadas `/api` todavía.

#### Evidencias

**Ev1 — apiUrl:** ambos environments declaran `apiUrl: 'http://localhost:4000/api'`, sin slash final.

![Ev1 ISS-02](images/Ev1-ISS-02.png)

**Ev2 — Environments:** existen `environment.ts` y `environment.development.ts`; `fileReplacements` los intercambia en desarrollo.

![Ev2 ISS-02](images/Ev2-ISS-02.png)

**Ev3 — Modelos:** 15 archivos en `core/models`, `tsc --noEmit` los compila y los campos de `Recycler` coinciden uno a uno con el modelo del backend (los `readonly` finales son las marcas de tiempo de Sequelize).

![Ev3 ISS-02](images/Ev3-ISS-02.png)

**Ev4 — Money:** `Money = number | string` y `toNumber()` normaliza; 11 campos numéricos usan `Money`.

![Ev4 ISS-02](images/Ev4-ISS-02.png)

**Ev5 — Payload de edición:** los `*UpdatePayload` son `Omit<..., 'status'>` o interfaces sin `status`; `UserUpdatePayload` no lo tiene.

![Ev5 ISS-02](images/Ev5-ISS-02.png)

**Ev6 — base:** los 12 servicios construyen `base` desde `environment.apiUrl`.

![Ev6 ISS-02](images/Ev6-ISS-02.png)

**Ev7 — Desenvolver:** `list()` hace `pipe(map((response) => response.recyclers))` y los demás métodos devuelven `Observable<Recycler>`; las 4 pruebas de `RecyclerApi` con `HttpTestingController` pasan.

![Ev7 ISS-02](images/Ev7-ISS-02.png)

**Ev8 — Pivotes:** `RoleUserApi` desenvuelve `{ assignments }` y `ResourceRoleApi` `{ grants }` con los filtros `roleId`/`resourceId`; sus 2 pruebas pasan.

![Ev8 ISS-02](images/Ev8-ISS-02.png)

**Ev9 — toApiMessage:** rama `status === 0` y lectura de `body.message`; las 4 pruebas (backend caído, 403, texto plano y error genérico) pasan.

![Ev9 ISS-02](images/Ev9-ISS-02.png)

**Ev10 — Notificaciones:** `success` 3000 ms, `info` 3500, `warn` 4500 y `error` 6000; la prueba lo comprueba sobre `MessageService`.

![Ev10 ISS-02](images/Ev10-ISS-02.png)

**Ev11 — UI compartida:** `app-page-header`, `app-empty-state` y `app-status-tag` con `input()`/`input.required()`; ningún CSS tiene reglas.

![Ev11 ISS-02](images/Ev11-ISS-02.png)

**Ev12 — StatusTag:** `label` y `severity` son `computed`; al pasar el input a `inactive` cambian a Inactivo/danger.

![Ev12 ISS-02](images/Ev12-ISS-02.png)

**Ev13 — Shell:** `shell.html` monta header, aside, `router-outlet`, footer, Drawer, `p-toast` y `p-confirmdialog` una vez; las 5 pruebas cubren composición, hosts, enlaces reales, Drawer en móvil y Aside oculto en escritorio.

![Ev13 ISS-02](images/Ev13-ISS-02.png)

**Ev14 — Rutas:** `prototype` y `Shell` con `loadComponent`; la hija de `Shell` redirige a `/prototype`. En el build servido, `/` termina en `/prototype` sin errores ni respuestas `/api`.

![Ev14 ISS-02](images/Ev14-ISS-02.png)

**Ev15 — HttpClient:** `provideHttpClient()` registrado y sin `withInterceptors`.

![Ev15 ISS-02](images/Ev15-ISS-02.png)

**Ev16 — Build:** código 0, Initial total 517.99 kB; `shell` (96.69 kB) y `prototype` (7.77 kB) como chunks diferidos.

![Ev16 ISS-02](images/Ev16-ISS-02.png)

**Ev17 — Pruebas:** 10 archivos y 33 pruebas aprobadas.

![Ev17 ISS-02](images/Ev17-ISS-02.png)

### Commit

```bash
git add angular.json vitest-base.config.ts src/environments src/app/app.config.ts src/app/app.routes.ts \
  src/app/core src/app/features/recyclers src/app/features/materials src/app/features/routes \
  src/app/features/collections src/app/features/settlements src/app/features/admin \
  src/app/shared src/app/layout/shell docs/PROCESO.md docs/images/Ev*-ISS-02.png
git commit -m "FRONT-ISS-02: Núcleo: environment, modelos, servicios y layout"
git push origin main
```

Commit: [`722a9ec`](https://github.com/DW-2026-IISem/dw-2026-Andreushin/commit/722a9ec543b8b8b1cbc6d27ef7a39201e67ba69d)

### ISS-03 — CRUD de recicladores con Signals

Primer CRUD completo contra `/api/recyclers` (equivale a «clientes» de la guía): listar, crear, editar, baja lógica y baja física. `RecyclerForm` recibe `recycler` y `resetKey` con `input()` y devuelve el resultado con `output()` (`saved`, `cancelled`); no llama a la API. `RecyclerList` guarda todo el estado en signals, filtra con `computed` y decide entre `POST` y `PATCH`. El formulario replica las reglas del backend: documento `^\d{5,15}(-\d)?$`, teléfono `^\+?\d{7,15}$`, tipo `independent`/`organization`.

Fase I: el backend ya exige JWT (no tiene `AUTH_ENABLED`), así que la carga contra él muestra el 401 real en `p-message`. El flujo de escritura se comprobó contra un stub temporal del contrato de `/api/recyclers` en el puerto 4000 (fuera del repositorio), sembrado con los 10 recicladores activos del backend; el `environment` no se tocó.

Criterios de aceptación (ISS-03)

- [x] `recycler-list` y `recycler-form` existen y son standalone (`imports: [...]`, sin `NgModule`)
- [x] `filterRows` es una función pura y probada
- [x] El formulario no llama a la API: entra por `input()` y sale por `output<RecyclerPayload>()` / `output<void>()`
- [x] La lista usa `computed`, no tiene filtrado imperativo y la tabla usa `#caption/#header/#body/#emptymessage` de PrimeNG 22 (sin `pTemplate`)
- [x] La ruta `recyclers` es hija de `Shell`, `/` redirige a ella, el menú apunta a `/recyclers` y los CSS no tienen reglas
- [x] `GET /api/recyclers` pinta la tabla con los recicladores activos del seeder
- [x] «Nuevo reciclador» abre el diálogo, valida y crea (`POST`)
- [x] Editar abre el mismo formulario con los datos cargados y hace `PATCH` sin `status`
- [x] El buscador filtra sin recargar y sin llamar al backend
- [x] La baja lógica y la física desaparecen de la tabla
- [x] Un fallo de carga (`GET`) se muestra en `p-message` con la tabla vacía
- [x] Un fallo de operación (guardar) se muestra en un toast y el diálogo sigue abierto
- [x] La consola no muestra errores de código
- [x] `ng build` termina con código 0 y las pruebas pasan

### Pasos

```bash
ng generate component features/recyclers/recycler-list --skip-tests --defaults
ng generate component features/recyclers/recycler-form --skip-tests --defaults
# core/utils/filter-rows.ts (+ spec), recycler-form.ts/html/spec, recycler-list.ts/html/spec,
# ruta `recyclers` hija de Shell y redirección '' → 'recyclers'
# vitest-base.config.mts: 1 worker y testTimeout 60 s (la máquina de 4 GB pagina con 2 workers)
npm start
```

### Verificación del ISS

```bash
grep -n "export function filterRows" src/app/core/utils/filter-rows.ts
grep -n "output<RecyclerPayload>\|output<void>" src/app/features/recyclers/recycler-form/recycler-form.ts
grep -n "computed(" src/app/features/recyclers/recycler-list/recycler-list.ts
grep -n "applyFilter" src/app/features/recyclers/recycler-list/recycler-list.ts || echo "sin applyFilter: correcto"
grep -n "#caption\|#header\|#body\|#emptymessage" src/app/features/recyclers/recycler-list/recycler-list.html
grep -n "pTemplate=" src/app/features/recyclers/recycler-list/recycler-list.html || echo "sin pTemplate: correcto"
grep -n "recyclers" src/app/app.routes.ts src/app/layout/shell/shell.ts
curl -s -i http://localhost:4000/api/recyclers | sed -n '1p;$p'
npm test -- --watch=false
ng build
```

**Verificación:** la tabla lista los activos, el diálogo crea y edita con el mismo formulario, el buscador filtra en memoria, las bajas recargan la tabla y cada fallo tiene su canal (`p-message` para la carga, toast para la operación).

#### Evidencias

**Ev1 — Componentes:** `recycler-list` y `recycler-form` con sus cuatro archivos; ambos declaran `imports: [...]` y no hay `NgModule`.

![Ev1 ISS-03](images/Ev1-ISS-03.png)

**Ev2 — filterRows:** función pura exportada; sus 5 pruebas (copia sin término, mayúsculas, números, `null`, sin coincidencias) pasan.

![Ev2 ISS-03](images/Ev2-ISS-03.png)

**Ev3 — Formulario:** `recycler`, `resetKey` y `saving` son `input()`; `saved` y `cancelled` son `output()`; no usa `RecyclerApi` ni `HttpClient`; sus 7 pruebas pasan.

![Ev3 ISS-03](images/Ev3-ISS-03.png)

**Ev4 — Lista y tabla:** `visibleRows` y `title` son `computed`, no hay `applyFilter`, y la tabla usa `#caption`, `#header`, `#body` y `#emptymessage` sin `pTemplate`.

![Ev4 ISS-03](images/Ev4-ISS-03.png)

**Ev5 — Ruta y menú:** `'' → recyclers`, ruta `recyclers` con `loadComponent` y menú `/recyclers`; los CSS de `recyclers/` no tienen reglas.

![Ev5 ISS-03](images/Ev5-ISS-03.png)

**Ev6 — Tabla:** `/recyclers` con los 10 recicladores activos del seeder, tipo, contacto, dirección, estado Activo, los tres iconos de acción y el contador «10 activos» (captura rehecha en el ISS-04 tras corregir los iconos).

![Ev6 ISS-03](images/Ev6-ISS-03.png)

**Ev7 — Crear:** «Guardar» vacío muestra los tres mensajes de validación sin petición; con datos válidos hace `POST /api/recyclers` con `status: "active"`, responde 201, cierra el diálogo y el contador pasa a «11 activos».

![Ev7 ISS-03](images/Ev7-ISS-03.png)

**Ev8 — Editar:** el formulario abre con los datos de Teodoro Valadez y el estado deshabilitado (`aria-disabled="true"`); «Guardar» hace `PATCH /api/recyclers/4` sin `status` y la fila muestra el teléfono nuevo.

![Ev8 ISS-03](images/Ev8-ISS-03.png)

**Ev9 — Buscador:** «maicao» deja «2 de 11 coinciden» y al borrarlo vuelven las filas; ninguna petición nueva.

![Ev9 ISS-03](images/Ev9-ISS-03.png)

**Ev10 — Bajas:** «Desactivar» hace `PATCH /api/recyclers/10/deactivate` (11 → 10 activos) y «Eliminar» hace `DELETE /api/recyclers/6` (10 → 9).

![Ev10 ISS-03](images/Ev10-ISS-03.png)

**Ev11 — Error de carga:** contra el backend real, `GET /api/recyclers` responde 401 y la pantalla muestra «Falta el token de acceso (Authorization: Bearer <token>)» en `p-message`, tabla vacía y «Sin recicladores activos».

![Ev11 ISS-03](images/Ev11-ISS-03.png)

**Ev12 — Error de operación:** un documento repetido responde 409; el toast muestra «No se pudo guardar · Ya existe un registro con esos datos únicos» y el diálogo sigue abierto.

![Ev12 ISS-03](images/Ev12-ISS-03.png)

**Ev13 — Consola:** abrir y cancelar los diálogos de alta y edición y buscar termina con 0 errores (solo el aviso de licencia de PrimeUI).

![Ev13 ISS-03](images/Ev13-ISS-03.png)

**Ev14 — Build y pruebas:** `ng build` código 0 (Initial total 549.79 kB; `recycler-list` 570.34 kB diferido); las 10 pruebas de la lista pasan y la suite queda en 13 archivos y 55 pruebas.

![Ev14 ISS-03](images/Ev14-ISS-03.png)

### Commit

```bash
git add angular.json vitest-base.config.ts vitest-base.config.mts src/app/app.routes.ts \
  src/app/core/utils/filter-rows.ts src/app/core/utils/filter-rows.spec.ts \
  src/app/features/recyclers/recycler-list src/app/features/recyclers/recycler-form \
  docs/PROCESO.md docs/images/Ev*-ISS-03.png
git commit -m "FRONT-ISS-03: CRUD de recicladores con Signals"
git push origin main
```

Commit: [`f69f34e`](https://github.com/DW-2026-IISem/dw-2026-Andreushin/commit/f69f34e0d94668953f43d8a6239506aeb2444fcc)

### ISS-04 — CRUD de materiales

Repetir el patrón del ISS-03 con una entidad más simple: `/api/materials` (equivale a «tipos de producto» de la guía). Se reutiliza todo: servicio de ISS-02, signals de estado, `filterRows`, `computed`, `resetKey`, diálogo, confirmaciones y canales de error. Cambian el modelo (`name`, `description`, `status`), los campos buscables y los límites, que salen del backend: nombre obligatorio de máximo 60 caracteres y único (409), descripción hasta 255. La pantalla vive dentro de `Shell`, así que por URL directa conserva Header, Aside y Footer.

Al revisar la tabla se encontró que los botones de acción no mostraban icono: en PrimeNG 22 el atributo `icon` del directivo `pButton` ya no pinta nada. Se corrigió con `<i pButtonIcon>` en recicladores y materiales, con una prueba de regresión en cada lista.

Criterios de aceptación (ISS-04)

- [x] `material-list` y `material-form` existen, son standalone y repiten la estructura de recicladores (solo cambian modelo, campos y textos)
- [x] La tabla lista los materiales activos del backend con sus acciones visibles
- [x] Crear valida nombre obligatorio y máximo 60 caracteres antes de enviar
- [x] Editar carga el material y hace `PATCH` sin `status`
- [x] La baja lógica oculta el material del listado
- [x] El buscador filtra por nombre y descripción usando `filterRows`, sin peticiones
- [x] La ruta `/materials` funciona por URL directa con Header, Aside y Footer
- [x] Un fallo de carga se muestra en `p-message`
- [x] Un fallo de operación (nombre repetido, 409) se muestra en un toast con el diálogo abierto
- [x] La consola no muestra errores de código
- [x] `ng build` termina con código 0 y las pruebas pasan

### Pasos

```bash
ng generate component features/materials/material-list --skip-tests --defaults
ng generate component features/materials/material-form --skip-tests --defaults
# material-form.ts/html/spec, material-list.ts/html/spec, material-api.spec.ts,
# ruta `materials` hija de Shell y entrada «Materiales» en el menú;
# botones de acción con <i pButtonIcon> en recycler-list.html y material-list.html
npm start
```

### Verificación del ISS

```bash
curl -s -i http://localhost:4000/api/materials | sed -n '1p;$p'
grep -n "materials" src/app/app.routes.ts src/app/layout/shell/shell.ts
grep -n "filterRows(this.rows()" src/app/features/materials/material-list/material-list.ts
grep -rn 'icon="pi' src/app/features --include=*-list.html | grep -v app-empty-state || echo "acciones con pButtonIcon: correcto"
npm test -- --watch=false
ng build
```

**Verificación:** misma pantalla que recicladores con otra entidad; la tabla lista, crea, edita, da de baja y filtra en memoria, y la URL directa monta el Shell completo.

#### Evidencias

**Ev1 — Qué se reutiliza:** `materials/` tiene servicio, prueba, lista y formulario; el `diff` de miembros entre `RecyclerList` y `MaterialList` solo muestra `typeLabel`, y el filtro usa `filterRows` con `name` y `description`.

![Ev1 ISS-04](images/Ev1-ISS-04.png)

**Ev2 — Tabla:** los 10 materiales activos del seeder (Aluminio … Vidrio) con descripción, estado, los tres iconos de acción y «10 activos».

![Ev2 ISS-04](images/Ev2-ISS-04.png)

**Ev3 — Crear y validar:** «Guardar» vacío y con 61 caracteres muestra «El nombre es obligatorio (máximo 60 caracteres).» sin petición; «Bolsa de leche» hace `POST /api/materials` (201) y el contador pasa a 11.

![Ev3 ISS-04](images/Ev3-ISS-04.png)

**Ev4 — Editar:** el formulario carga «Tetra Pak» con el estado bloqueado y su nota; «Guardar» hace `PATCH /api/materials/10` sin `status` y la fila muestra «Tetra Pak (envases)».

![Ev4 ISS-04](images/Ev4-ISS-04.png)

**Ev5 — Buscador:** «botellas» encuentra por descripción PET y Vidrio (2 de 10), «chatarra» por nombre (1 de 10) y un término sin resultados muestra «Sin coincidencias»; ninguna petición nueva.

![Ev5 ISS-04](images/Ev5-ISS-04.png)

**Ev6 — Baja lógica:** «Desactivar» en Vidrio hace `PATCH /api/materials/5/deactivate`; la recarga deja 9 activos y Vidrio ya no aparece.

![Ev6 ISS-04](images/Ev6-ISS-04.png)

**Ev7 — URL directa:** `GET /materials` sirve la app (200) y la pantalla abre en `/materials` con título «Materiales · CircularGuajira», Header, Aside y Footer presentes.

![Ev7 ISS-04](images/Ev7-ISS-04.png)

**Ev8 — Error de operación:** crear «Cartón» otra vez responde 409; el toast muestra «No se pudo guardar · Ya existe un registro con esos datos únicos» y el diálogo sigue abierto.

![Ev8 ISS-04](images/Ev8-ISS-04.png)

**Ev9 — Consola:** abrir y cancelar los diálogos y buscar termina con 0 errores (solo el aviso de licencia).

![Ev9 ISS-04](images/Ev9-ISS-04.png)

**Ev10 — Build y pruebas:** `ng build` código 0 (Initial total 550.03 kB; `material-list` 11.93 kB diferido); 24 pruebas de materiales y la suite completa en 16 archivos y 80 pruebas.

![Ev10 ISS-04](images/Ev10-ISS-04.png)

**Ev11 — Error de carga:** contra el backend real, `/materials` por URL directa recibe 401 y muestra «Falta el token de acceso…» en `p-message`, «Sin materiales activos» y el layout completo.

![Ev11 ISS-04](images/Ev11-ISS-04.png)

### Commit

```bash
git add src/app/app.routes.ts src/app/layout/shell/shell.ts src/app/layout/shell/shell.spec.ts \
  src/app/features/materials src/app/features/recyclers/recycler-list \
  docs/PROCESO.md docs/images/Ev6-ISS-03.png docs/images/Ev*-ISS-04.png
git commit -m "FRONT-ISS-04: CRUD de materiales"
git push origin main
```

Commit: [`9b80bc3`](https://github.com/DW-2026-IISem/dw-2026-Andreushin/commit/9b80bc3f52a48a0a811e64ccdf1022f2cf4169ce)

### ISS-05 — CRUD de rutas, puntos de recolección y su relación

Primera relación muchos-a-uno: cada punto de recolección pertenece a una ruta (`routeId`), igual que el producto de la guía pertenece a un tipo. Para tener rutas que elegir, este ISS incluye su CRUD (nombre único de 80, municipio de 60, descripción de 255), como el ISS-07 del backend («rutas y puntos de recolección»).

`CollectionPointList` carga puntos y rutas activas en paralelo con `forkJoin`; la tabla solo trae `routeId`, así que `routeName()` construye un `Map` una vez en un `computed` y resuelve cada fila. `routesWithoutPoints()` (equivalente a `lowStockCount()`) cuenta las rutas activas sin puntos, y un punto cuya ruta ya no está activa se marca en rojo («Ruta #5 (inactiva)»). El `p-select` del formulario usa `optionValue="id"`: guarda el número de la ruta, que es lo que espera `routeId`, no el objeto completo. El backend valida que la ruta esté activa (400), que el orden de visita sea único dentro de la ruta (409) y que una ruta con puntos no se elimine (409). No hay precio en este dominio, así que el formato de moneda llega con los pesajes.

Además, el combobox de `p-select` es un `span` que `<label for>` no etiqueta: los `p-select` de todos los formularios reciben `ariaLabelledBy` con el `id` de su etiqueta.

Criterios de aceptación (ISS-05)

- [x] Existen los servicios y las pantallas de rutas y puntos; la lista de puntos usa `forkJoin`, un `Map` en `computed` y `routesWithoutPoints`
- [x] El CRUD de rutas valida nombre y municipio y crea con `POST`
- [x] El listado de puntos muestra la ruta como texto, el orden de visita, el nombre, la dirección y el estado
- [x] El formulario solo recibe las rutas activas y su `p-select` usa `optionValue="id"` con etiqueta accesible
- [x] Crear un punto bloquea el envío sin ruta y envía `routeId` numérico; el contador de rutas sin puntos se actualiza
- [x] Crear un punto en una ruta que se desactivó falla (400) y el error se muestra al usuario
- [x] Un orden de visita repetido en la misma ruta se rechaza (409) en un toast
- [x] Editar conserva la ruta seleccionada (`routeId` numérico) y hace `PATCH` sin `status`
- [x] Tras desactivar una ruta, sus puntos la muestran como inactiva y el formulario ya no la ofrece
- [x] La ruta inactiva se ve en rojo en el listado
- [x] Una ruta con puntos no se puede eliminar (409) y el motivo se muestra
- [x] El buscador de puntos encuentra por nombre de ruta, nombre y dirección
- [x] Un fallo de carga se muestra en `p-message`
- [x] Las rutas `/routes` y `/collection-points` están en `Shell` y el menú, y los CSS no tienen reglas
- [x] `ng build` termina con código 0 y las pruebas pasan

### Pasos

```bash
ng generate component features/routes/route-list --skip-tests --defaults
ng generate component features/routes/route-form --skip-tests --defaults
ng generate component features/routes/collection-point-list --skip-tests --defaults
ng generate component features/routes/collection-point-form --skip-tests --defaults
# route-form/list, collection-point-form/list con sus pruebas, route-apis.spec.ts,
# rutas `routes` y `collection-points` hijas de Shell, menú «Rutas» y «Puntos de recolección»,
# ariaLabelledBy en los p-select de todos los formularios
npm start
```

### Verificación del ISS

```bash
curl -s -i http://localhost:4000/api/collection-points | sed -n '1p;$p'
grep -n "forkJoin\|new Map\|routesWithoutPoints = computed" src/app/features/routes/collection-point-list/collection-point-list.ts
grep -n 'optionValue="id"\|ariaLabelledBy="point-route' src/app/features/routes/collection-point-form/collection-point-form.html
grep -n "routes'\|collection-points'" src/app/app.routes.ts src/app/layout/shell/shell.ts
npm test -- --watch=false
ng build
```

**Verificación:** el punto se guarda con el id numérico de una ruta activa, la tabla muestra el nombre de la ruta resuelto con el `Map` y cada regla de la relación que rechaza el backend (ruta inactiva, orden repetido, ruta con puntos) llega al usuario.

#### Evidencias

**Ev1 — Estructura:** `features/routes/` tiene los dos servicios, su prueba y las cuatro pantallas; la lista de puntos usa `forkJoin`, `routeName = computed(...)` con `new Map(...)` y `routesWithoutPoints = computed(...)`.

![Ev1 ISS-05](images/Ev1-ISS-05.png)

**Ev2 — CRUD de rutas:** «Guardar» vacío muestra los mensajes de nombre y municipio; «Riohacha Norte» hace `POST /api/routes` (201) y pasan a «7 activas».

![Ev2 ISS-05](images/Ev2-ISS-05.png)

**Ev3 — Listado de puntos:** los 24 puntos del seeder con la ruta como texto (Riohacha Centro, Riohacha Sur, Maicao Comercial…), orden, nombre, dirección, estado y acciones; «0 rutas sin puntos».

![Ev3 ISS-05](images/Ev3-ISS-05.png)

**Ev4 — Select de rutas:** `[options]="routes()"`, `optionLabel="name"`, `optionValue="id"` y `ariaLabelledBy`; el control nace como `number | null` y se emite `routeId: value.routeId`; la tabla usa `routeName()` y `routeIsActive()`.

![Ev4 ISS-05](images/Ev4-ISS-05.png)

**Ev5 — Crear punto:** con la ruta nueva aparece «1 rutas sin puntos»; «Guardar» sin datos muestra «Elige una ruta activa»; al elegir «Riohacha Norte» se envía `"routeId":7` (número), responde 201 y el contador pasa a «0 rutas sin puntos».

![Ev5 ISS-05](images/Ev5-ISS-05.png)

**Ev6 — Ruta inactiva al guardar:** con el formulario abierto en «Manaure Salinas» se desactiva la ruta en el backend; «Guardar» recibe 400 y el toast muestra «No se pudo guardar · La ruta 5 debe estar activa» con el diálogo abierto.

![Ev6 ISS-05](images/Ev6-ISS-05.png)

**Ev7 — Orden repetido:** otro punto en «Riohacha Centro» con orden 1 responde 409: «La ruta 1 ya tiene un punto en el orden de visita 1 (Supermercado Razo Quintero)».

![Ev7 ISS-05](images/Ev7-ISS-05.png)

**Ev8 — Editar:** el formulario abre con «Maicao Comercial», orden 1 y estado bloqueado; «Guardar» hace `PATCH /api/collection-points/9` con `"routeId":3` y sin `status`.

![Ev8 ISS-05](images/Ev8-ISS-05.png)

**Ev9 — Tras desactivar la ruta:** los 4 puntos de Manaure muestran «Ruta #5 (inactiva)» y el `p-select` solo ofrece las 6 rutas activas (sin Manaure Salinas).

![Ev9 ISS-05](images/Ev9-ISS-05.png)

**Ev10 — Ruta inactiva en rojo:** la etiqueta de ruta de esos puntos cambia a `danger`.

![Ev10 ISS-05](images/Ev10-ISS-05.png)

**Ev11 — Ruta con puntos:** eliminar «Riohacha Centro» responde 409 y el toast dice «La ruta tiene 4 punto(s) de recolección; elimínalos o desactiva la ruta».

![Ev11 ISS-05](images/Ev11-ISS-05.png)

**Ev12 — Buscador:** «maicao comercial» encuentra por nombre de ruta los 4 puntos de esa ruta y «supermercado» encuentra por nombre 3 puntos; sin peticiones nuevas.

![Ev12 ISS-05](images/Ev12-ISS-05.png)

**Ev13 — Error de carga:** contra el backend real `/collection-points` recibe 401, `forkJoin` cancela la petición de rutas y la pantalla muestra «Falta el token de acceso…» y «Sin puntos activos».

![Ev13 ISS-05](images/Ev13-ISS-05.png)

**Ev14 — Rutas y menú:** `routes` y `collection-points` en `app.routes.ts` y en el menú del Shell; los CSS de `routes/` no tienen reglas.

![Ev14 ISS-05](images/Ev14-ISS-05.png)

**Ev15 — Build y pruebas:** `ng build` código 0 (Initial total 550.37 kB; `collection-point-list` 14.49 kB y `route-list` 12.11 kB diferidos); 24 pruebas de rutas y puntos y la suite en 21 archivos y 104 pruebas.

![Ev15 ISS-05](images/Ev15-ISS-05.png)

### Commit

```bash
git add src/app/app.routes.ts src/app/layout/shell/shell.ts src/app/layout/shell/shell.spec.ts \
  src/app/features/routes src/app/features/recyclers/recycler-form/recycler-form.html \
  src/app/features/materials/material-form/material-form.html \
  docs/PROCESO.md docs/images/Ev*-ISS-05.png
git commit -m "FRONT-ISS-05: CRUD de rutas, puntos de recolección y su relación"
git push origin main
```
