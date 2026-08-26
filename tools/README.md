# tools/ — recuperación de la web original

Este directorio existe porque **la sesión remota de Claude Code no tiene acceso de red a
`pazdj.com`**: la política de egress del entorno responde `403` a cualquier conexión
saliente hacia ese dominio (y hacia `web.archive.org`), tanto por `curl` como por
navegador real (`net::ERR_TUNNEL_CONNECTION_FAILED`).

El rediseño no puede empezar sin el material original, porque el encargo exige conservar
las fotografías, los textos, la paleta y la tipografía existentes, sin inventar nada.

## Opción A — permitir el dominio en el entorno (recomendada)

Añade `pazdj.com` (y opcionalmente `web.archive.org`) a la política de red del entorno de
Claude Code on the web. Documentación:
<https://code.claude.com/docs/en/claude-code-on-the-web>

Con eso, la auditoría se ejecuta sola en la sesión y no hace falta nada más.

## Opción B — ejecutar el volcado en tu PC

```bash
git clone https://github.com/marotorod/pazdj
cd pazdj
git checkout claude/pazdj-redesign-0fz53x
bash tools/scrape-original.sh
```

Al terminar, sube el resultado:

```bash
git add -f original
git commit -m "chore: volcado de la web original para la auditoría"
git push -u origin claude/pazdj-redesign-0fz53x
```

## Qué captura

| Salida | Contenido |
|---|---|
| `original/audit.json` | Textos, jerarquía de headings, enlaces y redes, imágenes (incluidos `background-image`), vídeos, embeds, tipografías reales con tamaños/pesos/tracking, paleta por frecuencia, metadatos SEO/OG/JSON-LD, scripts de terceros y traza de red completa |
| `original/rendered.html` | HTML **después** de ejecutar JavaScript |
| `original/visible-text.txt` | Todo el texto visible, literal, para no reescribir ni una coma |
| `original/assets/` | Imágenes, vídeos, fuentes y CSS originales descargados |
| `original/screenshots/` | Full-page y viewport en 320, 375, 390, 430, 768, 1024, 1280, 1440 y 1920 px, más el menú móvil abierto |
| `original/mirror/` | Espejo estático con `wget` (fallback) |

El script hace scroll completo antes de capturar, para disparar el lazy-load y que no se
escape ninguna fotografía.

## Notas

- Si ya tienes un Chromium instalado y no quieres que Playwright descargue el suyo,
  exporta `CHROMIUM_PATH=/ruta/al/chrome` antes de ejecutar el script.
- El volcado de `original/` es material de trabajo: se sube al repo de forma temporal para
  poder auditarlo, y se retira una vez el rediseño esté terminado y documentado.
