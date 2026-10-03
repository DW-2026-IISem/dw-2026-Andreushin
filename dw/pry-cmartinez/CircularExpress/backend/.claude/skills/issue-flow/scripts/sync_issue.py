#!/usr/bin/env python3
"""Sincroniza issues de GitHub y tarjetas del Project 9 a partir de trazabilidad/ISS-XX_*.md.

Uso:
  sync_issue.py ISS-03 [ISS-04 ...]   # sincroniza esos ISS
  sync_issue.py --all                 # sincroniza ISS-00..ISS-16

Por cada ISS: título limpio, cuerpo (objetivo, DoR, criterios, entregables, DoD, cierre),
labels, assignee, milestone y campos Size/Priority del tablero. Es idempotente.
El estado (Status) de la tarjeta NO se toca aquí: eso lo hace board.sh.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

OWNER = "DW-2026-IISem"
REPO = "DW-2026-IISem/dw-2026-Andreushin"
PROJECT_NUMBER = "9"
PROJECT_ID = "PVT_kwDOD-zeyM4BlF9F"
ASSIGNEE = "Andreushin"
MILESTONE = "Primer parcial – CircularExpress"
BACKEND_PATH = "dw/pry-cmartinez/CircularExpress/backend"
BLOB = f"https://github.com/{REPO}/blob/main/{BACKEND_PATH}/trazabilidad"
TRAZ = Path(__file__).resolve().parents[4] / "trazabilidad"

# Metadatos de planeación por ISS: (labels, Size, Priority)
META = {
    "ISS-00": (["infraestructura"], "XS", "P0"),
    "ISS-01": (["infraestructura"], "S", "P0"),
    "ISS-02": (["infraestructura", "base-de-datos"], "M", "P0"),
    "ISS-03": (["feature", "recoleccion"], "M", "P0"),
    "ISS-04": (["seeders", "base-de-datos"], "M", "P1"),
    "ISS-05": (["docs", "swagger"], "M", "P1"),
    "ISS-06": (["feature", "recoleccion"], "S", "P1"),
    "ISS-07": (["feature", "recoleccion"], "M", "P1"),
    "ISS-08": (["feature", "recoleccion"], "M", "P1"),
    "ISS-09": (["feature", "materiales"], "S", "P1"),
    "ISS-10": (["feature", "materiales"], "M", "P1"),
    "ISS-11": (["feature", "planta"], "S", "P2"),
    "ISS-12": (["feature", "planta"], "M", "P2"),
    "ISS-13": (["feature", "planta"], "L", "P2"),
    "ISS-14": (["feature", "liquidacion"], "M", "P2"),
    "ISS-15": (["feature", "liquidacion"], "L", "P2"),
    "ISS-16": (["verificacion"], "M", "P1"),
}
LABEL_BASE = "circular-express"
CORRECCIONES_TITULO = {"Runner Externe": "Runner Externo"}


def gh(*args, parse=False):
    out = subprocess.run(["gh", *args], check=True, capture_output=True, text=True).stdout
    return json.loads(out) if parse else out


def items_del_proyecto():
    data = gh("project", "item-list", PROJECT_NUMBER, "--owner", OWNER, "--format", "json", "--limit", "100", parse=True)
    res = {}
    for it in data["items"]:
        c = it.get("content", {})
        if c.get("repository") != REPO:
            continue
        m = re.search(r"\bISS-\d{2}\b", c.get("title", ""))
        if m:
            res[m.group(0)] = {"item": it["id"], "numero": c["number"]}
    return res


def campos():
    data = gh("project", "field-list", PROJECT_NUMBER, "--owner", OWNER, "--format", "json", parse=True)
    return {f["name"]: f for f in data["fields"]}


def seccion(texto, inicio_regex, fin_regex):
    m = re.search(inicio_regex, texto, re.M)
    if not m:
        return ""
    resto = texto[m.end():]
    f = re.search(fin_regex, resto, re.M)
    return resto[: f.start()] if f else resto


def parsear(ruta: Path):
    t = ruta.read_text(encoding="utf-8")
    titulo = re.search(r"^# (.+)$", t, re.M).group(1).strip()
    for mal, bien in CORRECCIONES_TITULO.items():
        titulo = titulo.replace(mal, bien)
    modulo = re.search(r"\*\*Módulo / Feature\*\* \| (.+?) \|", t)
    objetivo = re.search(r"^\*\*Objetivo:\*\*\s*(.+)$", t, re.M)
    bloqueado = re.search(r"^\*\*Bloqueado por:\*\*\s*(.+)$", t, re.M)
    criterios = re.findall(r"^\* \[( |x)\] (.+)$", t, re.M)
    # Entregables: subtítulos de implementación "#### N.M ..." (fuera de bloques de código)
    sin_codigo = re.sub(r"```.*?```", "", t, flags=re.S)
    entregables = [e.strip() for e in re.findall(r"^#{4,5} (?!Verificación|Criterios|Pasos)(.+)$", sin_codigo, re.M)]
    dod = re.findall(r"^\d\. (.+)$", seccion(t, r"^## 3\. Definición de Done", r"^## "), re.M)
    cierre = seccion(t, r"^## 4\. Cierre y trazabilidad", r"^## ").strip()
    return {
        "titulo": titulo,
        "modulo": modulo.group(1) if modulo else "",
        "objetivo": objetivo.group(1).strip() if objetivo else "",
        "bloqueado": bloqueado.group(1).strip() if bloqueado else "Ninguno.",
        "criterios": criterios,
        "entregables": entregables,
        "dod": dod,
        "cierre": cierre,
    }


def cuerpo(iss, d, ruta: Path, mapa):
    def enlazar_iss(txt):
        return re.sub(r"\b(ISS-\d{2})(-[A-E])?\b",
                      lambda m: f"{m.group(0)} (#{mapa[m.group(1)]['numero']})" if m.group(1) in mapa else m.group(0), txt)

    completado = bool(d["cierre"])
    l = [f"> 📄 Especificación completa: [`trazabilidad/{ruta.name}`]({BLOB}/{ruta.name})", ""]
    l += ["## 🎯 Objetivo", d["objetivo"] or d["titulo"], ""]
    l += ["## 🔗 Prerrequisitos (DoR)", f"- **Bloqueado por:** {enlazar_iss(d['bloqueado'])}"]
    if d["modulo"]:
        l.append(f"- **Módulo:** {d['modulo']}")
    l.append("")
    if d["criterios"]:
        l.append("## ✅ Criterios de aceptación")
        l += [f"- [{m}] {c}" for m, c in d["criterios"]]
        l.append("")
    if d["entregables"]:
        l.append("## 📦 Entregables")
        marca = "x" if completado else " "
        l += [f"- [{marca}] {e}" for e in d["entregables"]]
        l.append("")
    if d["dod"]:
        l.append("## 🏁 Definición de Done")
        marca = "x" if completado else " "
        l += [f"- [{marca}] {x}" for x in d["dod"]]
        l.append("")
    if d["cierre"]:
        l += ["## 🔒 Cierre y trazabilidad", d["cierre"], ""]
    l += ["---",
          f"Flujo: **Preparado → En curso → Verificacion → Hecho**. Al cerrar se publican dos commits: "
          f"`feat({iss.lower()})` (implementación) y `docs({iss.lower()})` (evidencias + hash en la trazabilidad)."]
    return "\n".join(l) + "\n"


def asegurar_labels():
    existentes = {x["name"] for x in gh("label", "list", "-R", REPO, "--limit", "100", "--json", "name", parse=True)}
    colores = {
        LABEL_BASE: ("1f883d", "Proyecto CircularExpress backend (Express 5 + Sequelize)"),
        "infraestructura": ("5319e7", "Entorno, esqueleto y configuración base"),
        "base-de-datos": ("0e8a16", "Sequelize, conexión multi-motor y datos"),
        "feature": ("1d76db", "Módulo de negocio CRUD"),
        "seeders": ("fbca04", "Poblamiento de datos con Faker"),
        "docs": ("0075ca", "Documentación"),
        "swagger": ("85e89d", "OpenAPI 3 / Swagger"),
        "verificacion": ("d93f0b", "Verificación global e integración"),
        "recoleccion": ("c5def5", "Subsistema: recicladores, rutas, puntos y jornadas"),
        "materiales": ("bfd4f2", "Subsistema: materiales y tarifas"),
        "planta": ("d4c5f9", "Subsistema: plantas, lotes y pesajes"),
        "liquidacion": ("f9d0c4", "Subsistema: ventas y liquidaciones"),
    }
    for nombre, (color, desc) in colores.items():
        if nombre not in existentes:
            gh("label", "create", nombre, "-R", REPO, "--color", color, "--description", desc)


def asegurar_milestone():
    ms = gh("api", f"repos/{REPO}/milestones?state=all", parse=True)
    if not any(m["title"] == MILESTONE for m in ms):
        gh("api", f"repos/{REPO}/milestones", "-f", f"title={MILESTONE}",
           "-f", "description=Backend CircularExpress: ISS-00 a ISS-16")


def opcion(campo, nombre):
    for o in campo.get("options", []):
        if o["name"] == nombre:
            return o["id"]
    raise SystemExit(f"El campo {campo['name']} no tiene la opción {nombre}")


def sincronizar(iss, mapa, cs):
    rutas = sorted(TRAZ.glob(f"{iss}_*.md"))
    if not rutas:
        print(f"⚠️  {iss}: no existe trazabilidad/{iss}_*.md")
        return
    if iss not in mapa:
        print(f"⚠️  {iss}: no está en el Project {PROJECT_NUMBER}")
        return
    ruta, info = rutas[0], mapa[iss]
    d = parsear(ruta)
    labels, size, prioridad = META.get(iss, ([], None, None))
    cuerpo_md = cuerpo(iss, d, ruta, mapa)
    args = ["issue", "edit", str(info["numero"]), "-R", REPO, "--title", d["titulo"], "--body", cuerpo_md,
            "--add-assignee", ASSIGNEE, "--milestone", MILESTONE, "--add-label", ",".join([LABEL_BASE, *labels])]
    gh(*args)
    for nombre, valor in (("Size", size), ("Prioridad", prioridad)):
        if valor:
            gh("project", "item-edit", "--id", info["item"], "--project-id", PROJECT_ID,
               "--field-id", cs[nombre]["id"], "--single-select-option-id", opcion(cs[nombre], valor))
    print(f"✔ {iss} (#{info['numero']}) sincronizado: {d['titulo']}")


def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        sys.exit(1)
    objetivos = list(META) if args == ["--all"] else [a.upper() for a in args]
    asegurar_labels()
    asegurar_milestone()
    mapa, cs = items_del_proyecto(), campos()
    for iss in objetivos:
        sincronizar(iss, mapa, cs)


if __name__ == "__main__":
    main()
