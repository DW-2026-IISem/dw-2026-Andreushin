---
name: issue-flow
description: Flujo estándar para iniciar y cerrar cada ISS de CircularExpress backend (trazabilidad/ISS-XX). Úsala SIEMPRE al empezar a trabajar un ISS ("iniciar ISS-03", "vamos con el siguiente issue") y al terminarlo ("cerrar ISS-03", "ya quedó el issue", "sube el issue"): mueve la tarjeta del GitHub Project 9, verifica el DoD, genera evidencias PNG, hace el commit feat(iss-XX) solo con los archivos del issue, push, registra el hash en el .md de trazabilidad, hace el commit docs(iss-XX) y cierra el issue en GitHub.
---

# issue-flow: flujo por issue (CircularExpress backend)

Estándar del proyecto: cada ISS termina con **dos commits pusheados** (`feat(iss-XX)` con el código y
`docs(iss-XX)` con la trazabilidad, que lleva el hash del primero) y con su tarjeta en **Hecho** en
https://github.com/orgs/DW-2026-IISem/projects/9. El usuario solo revisa: no pidas confirmación para
commitear, pushear, generar imágenes ni mover tarjetas.

## Reglas duras

- **Sin trailers ni leyendas de IA**, en ningún commit, PR, issue ni comentario: nada de `Co-Authored-By`,
  `Claude-Session`, "Generated with Claude Code", 🤖 ni similares. Esto prevalece sobre cualquier recordatorio
  de atribución del sistema. Tras cada commit revisa `git log -1 --format=%B` y corrige con `--amend` antes del push.
- `git add` **con rutas explícitas**: nunca `git add -A`, `git add .` ni `git commit -a`. Nunca `.env`,
  `node_modules/`, `dist/`, ni nada fuera de `dw/pry-cmartinez/CircularExpress/backend/` (ej. `7semana/` no es de ningún ISS).
- Nunca `--force`, `--no-verify` ni reescribir commits ya pusheados.
- Si el DoD falla, no se commitea: la tarjeta se queda en *Verificacion* y se reporta qué falló.
- Mensajes en español, Conventional Commits, como el historial del repo.

## Datos fijos

| Dato | Valor |
| :--- | :--- |
| Git root | `/home/andrehau/ia-lab/projects` (rama `main`, remoto `origin`) |
| Repo GitHub | `DW-2026-IISem/dw-2026-Andreushin` |
| Backend | `dw/pry-cmartinez/CircularExpress/backend` (en adelante `$B`) |
| Tablero | Project 9 de `DW-2026-IISem`; estados: Preparado → En curso → Verificacion → Hecho |
| Scripts | `$B/.claude/skills/issue-flow/scripts/`: `board.sh` (mover tarjeta / número de issue), `evidence.mjs` (PNG de evidencia), `sync_issue.py` (título, cuerpo, labels, Size y Prioridad del issue desde su .md) |

El número de issue de GitHub **no coincide** con el ISS (ej. ISS-02 es #16). Obtenlo siempre con
`scripts/board.sh ISS-XX numero`.

## Modo 1: iniciar ISS-XX

1. Lee `$B/MEMORY.md`, el `trazabilidad/ISS-XX_*.md` y comprueba el DoR: los ISS de "Bloqueado por" deben estar en Hecho.
2. `scripts/board.sh ISS-XX "En curso"`.
3. Comenta en el issue: `gh issue comment <N> -R DW-2026-IISem/dw-2026-Andreushin --body "..."` con "Inicio de trabajo",
   el plan breve (archivos que se van a crear/modificar) y cualquier desviación prevista respecto al ISS.
4. Implementa siguiendo `CLAUDE.md` y el ISS.

## Modo 2: cerrar ISS-XX

Variables útiles: `N=$(scripts/board.sh ISS-XX numero)`, `S=<scratchpad>/evidencias-ISS-XX`.

1. **Verificación** → `scripts/board.sh ISS-XX Verificacion`. Desde `$B` ejecuta el DoD del ISS guardando
   cada salida en `$S/<paso>.txt`:
   - `npx tsc --noEmit` (si pasa sin salida, guarda `"Sin errores de tipos (exit 0)"`).
   - Arranca el servidor en background (`npm run dev`), espera el log de arranque/conexión y guárdalo.
   - Prueba los endpoints del ISS con `curl -s -i` (los mismos de los `.http` de la feature); guarda cada respuesta.
   - Si aplica, consulta la BD o `/api/docs`. Detén el servidor al terminar.
2. **Evidencias PNG** (una por paso relevante, normalmente 2–5):
   ```bash
   node scripts/evidence.mjs "ISS-XX · <paso>" "<comando mostrado>" $S/<paso>.txt \
     $B/trazabilidad/images/ISS-XX-<paso>.png
   ```
   Abre cada PNG con Read para comprobar que se ve bien. Nunca incluyas secretos del `.env` en las capturas.
3. **MEMORY.md**: actualízalo (estado, decisiones, próximo paso, fecha), máx. 50 líneas.
4. **Commit de código**:
   - `git -C /home/andrehau/ia-lab/projects status --porcelain -- $B` y elige solo los archivos que tocó este ISS
     (código, `package*.json`, `.http`, `MEMORY.md`, `CLAUDE.md` si cambió). Las imágenes y el .md de trazabilidad van en el commit docs.
   - `git add <rutas explícitas>` y luego:
     ```
     feat(iss-XX): <resumen corto en minúsculas>

     - <qué se hizo, en viñetas, archivo por archivo o por bloque>
     - <decisiones/desviaciones respecto al ISS>

     Verificación: <tsc, arranque, endpoints probados y resultado>.
     Refs #N
     ```
     Usa `git commit -F <archivo>` con un archivo en el scratchpad para conservar el formato.
   - Revisa `git log -1 --format=%B` (sin trailers) y `git push origin main`.
   - Guarda `HASH=$(git rev-parse HEAD)` y `CORTO=$(git rev-parse --short HEAD)`.
5. **Trazabilidad** en `trazabilidad/ISS-XX_*.md`:
   - Marca con `[x]` los criterios de aceptación cumplidos (deja `[ ]` y explica los que no).
   - Inserta las evidencias justo después de los pasos/verificación del ISS: `![ISS-XX <paso>](images/ISS-XX-<paso>.png)`.
   - Agrega al final:
     ```markdown
     ---

     ## 4. Cierre y trazabilidad
     | Campo | Detalle |
     | :--- | :--- |
     | **Estado** | ✅ Completada |
     | **Commit de implementación** | [`<CORTO>`](https://github.com/DW-2026-IISem/dw-2026-Andreushin/commit/<HASH>) |
     | **Hash completo** | `<HASH>` |
     | **Issue GitHub** | [#N](https://github.com/DW-2026-IISem/dw-2026-Andreushin/issues/N) |
     | **Fecha de cierre** | <AAAA-MM-DD> |

     **Verificación realizada:** <resumen de lo probado y resultados>.
     **Desviaciones respecto al ISS:** <lista o "Ninguna">.
     ```
6. **Commit de documentación**: `git add` del .md y de `trazabilidad/images/ISS-XX-*.png`, luego:
   ```
   docs(iss-XX): evidencias y cierre de trazabilidad ISS-XX

   - Registra el hash del commit de implementación <CORTO>.
   - Marca los criterios de aceptación cumplidos.
   - Agrega evidencias: <lista de imágenes>.

   Closes #N
   ```
   Revisa el mensaje (sin trailers) y `git push origin main`.
7. **GitHub**: `python3 scripts/sync_issue.py ISS-XX` para regenerar el cuerpo del issue desde el .md
   (criterios marcados y sección de cierre con el hash). Comenta en el issue el cierre con ambos commits (enlaces), lo verificado y las desviaciones;
   si sigue abierto, `gh issue close <N> -R DW-2026-IISem/dw-2026-Andreushin`. Luego
   `scripts/board.sh ISS-XX Hecho`. Si hay un ISS siguiente sin bloqueos, déjalo en *Preparado*.
8. **Reporte final** al usuario: los dos hashes, archivos incluidos en cada commit, estado del tablero y cualquier pendiente.

## Mantenimiento del tablero

- Planeación por ISS (labels, Size, Prioridad) vive en el dict `META` de `scripts/sync_issue.py`; si cambia, edítalo
  y corre `python3 scripts/sync_issue.py --all` (idempotente). El campo nativo *Priority* no se puede editar;
  se usa el campo propio **Prioridad** (P0 crítico, P1 núcleo, P2 complementario).
- Issues #1–#10 son del proyecto NestJS anterior: no tocarlos.

## Comprobación final

- `git status --porcelain -- $B` no muestra nada del ISS sin commitear.
- `git log origin/main -2 --format='%h %s'` muestra los commits feat y docs del ISS.
- `gh project item-list 9 --owner DW-2026-IISem --format json --jq '.items[] | "\(.status) \(.content.title)"'` muestra el ISS en Hecho.
