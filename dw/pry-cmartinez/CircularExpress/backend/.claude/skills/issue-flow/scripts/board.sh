#!/usr/bin/env bash
# Mueve la tarjeta de un ISS en el tablero GitHub Project 9 (DW-2026-IISem).
# Uso: board.sh ISS-XX "<Preparado|En curso|Verificacion|Hecho>"
#      board.sh ISS-XX numero   -> imprime el número del issue en GitHub
set -euo pipefail

OWNER="DW-2026-IISem"
REPO="DW-2026-IISem/dw-2026-Andreushin"
PROJECT_NUMBER=9
PROJECT_ID="PVT_kwDOD-zeyM4BlF9F"
STATUS_FIELD="PVTSSF_lADOD-zeyM4BlF9Fzhj0G7Y"

ISS="${1:?Falta el ISS (ej. ISS-03)}"
ACCION="${2:?Falta el estado o 'numero'}"

ITEM=$(gh project item-list "$PROJECT_NUMBER" --owner "$OWNER" --format json --limit 100 \
  --jq ".items[] | select(.content.repository == \"$REPO\") | select(.content.title | test(\"\\\\b$ISS\\\\b\")) | \"\(.id) \(.content.number)\"" | head -1)
if [ -z "$ITEM" ]; then
  echo "No se encontró la tarjeta de $ISS en el proyecto $PROJECT_NUMBER" >&2
  exit 1
fi
ITEM_ID="${ITEM%% *}"
NUMERO="${ITEM##* }"

if [ "$ACCION" = "numero" ]; then
  echo "$NUMERO"
  exit 0
fi

case "$ACCION" in
  "Preparado")    OPCION="c22d3caa" ;;
  "En curso")     OPCION="1d3a4ce6" ;;
  "Verificacion") OPCION="602004b0" ;;
  "Hecho")        OPCION="98236657" ;;
  *) echo "Estado inválido: $ACCION" >&2; exit 1 ;;
esac

gh project item-edit --id "$ITEM_ID" --project-id "$PROJECT_ID" \
  --field-id "$STATUS_FIELD" --single-select-option-id "$OPCION" > /dev/null
echo "$ISS (#$NUMERO) → $ACCION"
