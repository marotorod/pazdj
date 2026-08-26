#!/usr/bin/env bash
# Volcado completo de pazdj.com para poder auditarla y reconstruirla sin conexión.
#
# Requisitos: Node.js 18+ y (opcional) wget.
# Uso:  bash tools/scrape-original.sh
#
# Genera:
#   original/audit.json           inventario estructurado (textos, links, colores, tipografías…)
#   original/rendered.html        HTML tras ejecutar JavaScript
#   original/visible-text.txt     todo el texto visible, literal
#   original/assets/              imágenes, vídeos, fuentes y CSS originales
#   original/screenshots/         capturas full-page en 9 breakpoints
#   original/mirror/              espejo estático del sitio (si wget está disponible)

set -euo pipefail
URL="${1:-https://pazdj.com/}"
cd "$(dirname "$0")/.."

echo "▸ Instalando Playwright (solo la primera vez)…"
npm install --no-save playwright@latest
npx playwright install chromium

echo "▸ Auditando ${URL} con navegador real…"
node tools/audit-original.mjs "$URL"

if command -v wget >/dev/null 2>&1; then
  echo "▸ Espejo estático con wget…"
  mkdir -p original/mirror
  wget --mirror --page-requisites --adjust-extension --convert-links --no-parent \
       --directory-prefix=original/mirror \
       --user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36" \
       "$URL" || echo "· wget terminó con avisos (normal si hay recursos externos)"
else
  echo "· wget no encontrado, se omite el espejo estático (no es imprescindible)"
fi

echo
echo "✅ Listo. Ahora sube el resultado al repo:"
echo "     git add -f original tools"
echo "     git commit -m \"chore: volcado de la web original para la auditoría\""
echo "     git push -u origin claude/pazdj-redesign-0fz53x"
