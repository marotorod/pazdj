# pazdj.com

Sitio oficial de **PAZ**, DJ colombiana de la escena underground.

Una sola página, estática, sin dependencias en tiempo de ejecución. Reconstruye
la identidad visual de la web anterior (una exportación de Canva Sites) sobre
una base responsive, accesible e indexable.

- **Auditoría del sitio anterior:** [`SITE_AUDIT.md`](./SITE_AUDIT.md)
- **Qué se conservó y qué cambió:** [`MIGRATION.md`](./MIGRATION.md)

---

## Stack

| Pieza     | Elección                                                      | Por qué                                                                                                                                                                   |
| --------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework | **Astro 5**                                                   | Genera HTML estático. No envía runtime al navegador salvo lo que se pida explícitamente.                                                                                  |
| Lenguaje  | **TypeScript** en modo `strict`                               | Los datos del sitio están tipados; `astro check` los valida en CI.                                                                                                        |
| Estilos   | **Tailwind CSS 4** (`@theme`) + CSS con ámbito por componente | Tailwind aporta la capa de _design tokens_; la maquetación editorial se escribe en CSS propio dentro de cada componente, que es más legible que una cadena de utilidades. |
| Imágenes  | `astro:assets` + **sharp**                                    | AVIF/WebP, `srcset`, `sizes` y `width`/`height` generados en el build.                                                                                                    |
| Sitemap   | `@astrojs/sitemap`                                            | —                                                                                                                                                                         |
| Tests     | **Playwright** + **axe-core**                                 | Accesibilidad, responsive, enlaces y comportamiento sin JS.                                                                                                               |

JavaScript enviado al navegador: **dos scripts diminutos** (aparición al hacer
scroll y carga de embeds bajo demanda). Sin framework de UI, sin hidratación,
sin librería de iconos.

---

## Requisitos

- **Node.js 20.11 o superior** (se ha desarrollado sobre Node 24).
- npm 10+.

## Desarrollo

```bash
npm install
npm run dev
```

Servidor de desarrollo en `http://localhost:4321`.

## Build de producción

```bash
npm run build
```

El sitio queda en `dist/`, listo para servir como archivos estáticos.
Para revisarlo tal y como quedará publicado:

```bash
npm run preview
```

## Comandos disponibles

| Comando                | Qué hace                                                                  |
| ---------------------- | ------------------------------------------------------------------------- |
| `npm run dev`          | Servidor de desarrollo con recarga en caliente                            |
| `npm run build`        | Build de producción en `dist/`                                            |
| `npm run preview`      | Sirve `dist/` localmente                                                  |
| `npm run check`        | Comprobación de tipos (`astro check`)                                     |
| `npm run lint`         | ESLint + Prettier en modo comprobación                                    |
| `npm run format`       | Aplica Prettier                                                           |
| `npm run audit`        | Accesibilidad, SEO, foco, táctiles, sin-JS y terceros (requiere build)    |
| `npm run interactions` | Embeds, contraste y enlaces externos (requiere build)                     |
| `npm run shots`        | Capturas comparativas original vs. nueva en `screenshots/`                |
| `npm run measure`      | Compara proporciones del hero entre ambas capturas                        |
| `npm run verify`       | Todo lo anterior en cadena: tipos, lint, build, auditoría e interacciones |

`audit`, `interactions` y `shots` necesitan el navegador de Playwright:

```bash
npx playwright install chromium
```

---

## Estructura

```
src/
├─ assets/
│  ├─ brand/          logotipo «PAZ» vectorizado y logo de YIN YANG
│  └─ photos/         las siete fotografías originales, en su máxima resolución
├─ components/
│  ├─ Hero.astro          retrato + logotipo + tagline
│  ├─ Bio.astro           biografía y columna de redes
│  ├─ SocialRail.astro    los cuatro enlaces sociales
│  ├─ Gallery.astro       mosaico de fotos, letras «P 4 Z» y SoundCloud
│  ├─ FeaturedSet.astro   sesión destacada en YouTube
│  ├─ Contact.astro       contacto y créditos (es el <footer>)
│  ├─ EmbedFrame.astro    fachada de carga bajo demanda para embeds
│  ├─ Icon.astro          renderiza un icono del catálogo
│  └─ Wordmark.astro      el logotipo «PAZ»
├─ data/
│  ├─ site.ts         TEXTOS, ENLACES Y CONTACTO  ← se edita casi todo aquí
│  ├─ photos.ts       fotografías, textos alternativos y puntos focales
│  └─ icons.ts        trazados de los iconos (generado, ver MIGRATION.md)
├─ layouts/
│  └─ Base.astro      <head>, metadatos, JSON-LD, skip link
├─ pages/
│  └─ index.astro     la página
└─ styles/
   └─ global.css      design tokens, tipografías y estilos base

public/
├─ fonts/             Poppins 200 y 300 autoalojada (subconjuntos latin)
├─ og.jpg             imagen para redes sociales, 1200 × 630
├─ favicon-*.png      favicons originales
└─ robots.txt
```

---

## Cómo modificar el contenido

Casi todo vive en **`src/data/site.ts`**. No hay CMS ni panel: se edita el
archivo y se vuelve a construir.

**Textos de la biografía** — el array `bio`, un elemento por párrafo:

```ts
export const bio: readonly string[] = [
  'PAZ es una DJ colombiana cuya conexión…',
  // …
];
```

**Redes sociales** — el array `socials`. Para añadir una plataforma hacen falta
dos pasos: la entrada aquí y su icono en `src/data/icons.ts`.

```ts
{ id: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/_paz_x_mendez_' },
```

**Contacto** — el objeto `contact`. `phoneDisplay` es lo que se ve;
`phoneE164` y `whatsapp` son los destinos técnicos:

```ts
const PHONE_E164 = '+573181121845';

export const contact = {
  email: 'mariapazmendezespinosa@gmail.com',
  phoneDisplay: '3181121845', // lo que se ve
  phoneE164: PHONE_E164, // fuente única del destino
  whatsapp: `https://wa.me/${PHONE_E164.replace('+', '')}`,
};
```

**Sesión destacada** — el objeto `featuredSet`. Para cambiar de vídeo hay que
actualizar `videoId`, `watchUrl`, `videoTitle` y la miniatura (ver abajo).

**Título y descripción para buscadores** — el objeto `site`.

---

## Cómo cambiar las fotografías

1. Deja el archivo nuevo en `src/assets/photos/`.
2. Cambia el `import` correspondiente en `src/data/photos.ts`.
3. Actualiza su `alt` y, si hace falta, su `focus`.

Astro regenera solos los tamaños, los formatos AVIF/WebP, el `srcset` y los
atributos `width`/`height`. **No hay que preparar recortes a mano.**

```ts
{
  src: cabina,
  alt: 'PAZ mezclando en la cabina de un club, vista entre dos columnas.',
  focus: '50% 40%',   // object-position cuando la foto se recorta
  opacity: 0.66,      // opcional: sólo si forma parte del tratamiento visual
}
```

**`focus` es importante.** Es el `object-position` que se aplica cuando la foto
se recorta para encajar en su celda. Si el sujeto queda descentrado en móvil,
se ajusta aquí: `'50% 20%'` sube el encuadre, `'50% 70%'` lo baja.

### La miniatura del vídeo

`src/assets/photos/reconecta2-345-poster.jpg` es la miniatura de YouTube,
descargada y **autoalojada** para no contactar con `i.ytimg.com` en la carga
inicial. Si cambia el vídeo, hay que sustituirla:

```bash
curl -o src/assets/photos/reconecta2-345-poster.jpg \
  https://i.ytimg.com/vi/NUEVO_ID/maxresdefault.jpg
```

### La imagen para redes (`og.jpg`)

Se compuso a partir del retrato del hero y del logotipo. Si cambia el retrato,
hay que regenerarla a 1200 × 630 y dejarla en `public/og.jpg`.

---

## Cómo desplegar

`dist/` son archivos estáticos: sirve con cualquier hosting estático.

**Netlify**

```
Build command:    npm run build
Publish directory: dist
```

**Vercel** — detecta Astro automáticamente. Si no: build `npm run build`,
salida `dist`.

**Cloudflare Pages** — build `npm run build`, salida `dist`.

**Servidor propio** — copia el contenido de `dist/` a la raíz del dominio.

### Antes de publicar

1. El dominio de producción está fijado en `astro.config.mjs` (`site`) y en
   `src/data/site.ts` (`url`). De ahí salen el `canonical`, el `sitemap` y las
   URLs de Open Graph: si el dominio cambia, hay que tocar los dos sitios.
2. Sirve `/_astro/*` y `/fonts/*` con caché larga (`max-age=31536000, immutable`):
   sus nombres llevan hash.
3. Comprueba que el `Content-Type` de los `.woff2` sea `font/woff2`.

### Verificación previa

```bash
npm run verify
```

Encadena tipos, lint, build, auditoría de accesibilidad e interacciones. Debe
terminar sin fallos.
