# MIGRATION.md — De Canva Sites a Astro

Resumen de la reconstrucción de `pazdj.com`: qué se conservó intacto, qué se
mejoró, en qué se aparta de la web anterior y por qué.

El inventario completo del punto de partida está en [`SITE_AUDIT.md`](./SITE_AUDIT.md).

---

## 1. Qué se ha conservado

### Contenido — literal, sin una sola palabra nueva

- Los **cuatro párrafos** de la biografía, con su ortografía y puntuación.
- La tagline **`... Is the Only Revolution.`**
- El texto completo de la **sesión destacada**.
- El rótulo **`CONTACTO:`**, el correo y el teléfono `3181121845`.
- El crédito **`diseño:` + YIN YANG + `Drive Presskit`**.
- Los **cuatro destinos sociales**, el vídeo de YouTube y el perfil de SoundCloud.

Todo vive en `src/data/site.ts`, copiado del DOM en producción.

### Identidad visual

| Elemento                | Cómo se conserva                                                        |
| ----------------------- | ----------------------------------------------------------------------- |
| Paleta                  | `#800000`, `#281f1d`, `#a6a6a6`, `#bcbcbc`, `#ffffff` — valores exactos |
| Logotipo «PAZ»          | Vectorizado desde el render original: trazado idéntico                  |
| Orden de secciones      | Hero → biografía → galería → vídeo → contacto                           |
| Retrato del hero        | La misma imagen, a **0,78** de opacidad sobre el rojo                   |
| Alineación a la derecha | Biografía y texto del vídeo la mantienen en todos los anchos            |
| Mosaico                 | Misma retícula, mismas fotos, mismas posiciones relativas               |
| Opacidades del mosaico  | **0,66** y **0,71**, sin tocar                                          |
| Textura de fondo        | La misma foto al **0,14** en las secciones 4 y 5, con el mismo encuadre |
| Letras «P 4 Z»          | Conservadas como acentos decorativos en el espacio negativo             |
| Favicons                | Los archivos originales                                                 |

### Fotografías

Las **siete originales**, descargadas en la máxima resolución disponible. Cero
imágenes de stock, cero imágenes generadas, cero recortes destructivos. Cuando
había dos copias del mismo archivo, se conservó la menos recomprimida:
`paz-retrato-gorro.jpg` pesa 196 KB frente a los 83 KB que sirve hoy pazdj.com.

### Verificación de fidelidad

Medida píxel a píxel sobre capturas de ambas versiones a 1440 px
(`npm run measure`):

| Medida              | Original     | Nueva            |
| ------------------- | ------------ | ---------------- |
| Logotipo «PAZ»      | 189 × 189 px | **189 × 189 px** |
| Posición horizontal | x = 954      | **x = 958**      |
| Posición vertical   | y = 351      | **y = 351**      |
| Centro horizontal   | 72,78 %      | **73,06 %**      |

---

## 2. Qué se ha mejorado

### Responsive: el cambio de fondo

La web anterior **no se adaptaba**: escalaba un lienzo fijo. En un móvil de
390 px el documento entero medía 956 px de alto y el cuerpo de texto quedaba
en **≈ 6 px**.

Ahora la composición se **recoloca**, no se encoge:

|                    | Antes (390 px) | Ahora (390 px)            |
| ------------------ | -------------- | ------------------------- |
| Alto del documento | 956 px         | 3 859 px                  |
| Cuerpo de texto    | ≈ 6 px         | **17 px**                 |
| Iconos sociales    | ≈ 22 px        | **44 × 44 px** mínimo     |
| Scroll horizontal  | —              | ninguno, de 320 a 1920 px |

La escala tipográfica es fluida (`clamp()`) y está **derivada de los porcentajes
del lienzo original**, no inventada: la biografía era el 1,59 % del ancho, y ese
es exactamente el término central de su `clamp()`.

Cambios de composición por sección:

- **Hero.** En escritorio se reconstruye la composición original (retrato a la
  izquierda con sangrado vertical, logotipo a la derecha, tagline centrada
  debajo). Por debajo de 1024 px el retrato pasa arriba y el logotipo respira
  sobre el campo rojo, conservando la relación «foto dominante + tipografía
  sobre rojo» sin superponer texto al rostro.
- **Galería.** Mosaico 3 × 3 en escritorio, 2 columnas en móvil, con altura de
  fila derivada del ancho real disponible para que nada se estire.
- **Vídeo.** Columna de texto y reproductor en paralelo en escritorio, apilados
  en móvil.

### Accesibilidad — de ningún titular a WCAG 2.2 AA

`npm run audit` ejecuta **axe-core** contra el build en escritorio y móvil:
**0 violaciones**, más 28 comprobaciones propias.

| Antes                        | Ahora                                                          |
| ---------------------------- | -------------------------------------------------------------- |
| Ni un solo `h1`–`h6`         | Un `h1` («PAZ») y cuatro `h2` de sección                       |
| Enlaces sociales sin nombre  | Nombre accesible en cada uno, con aviso de pestaña nueva       |
| Ninguna imagen con `alt`     | `alt` descriptivo en todas; vacío en las decorativas           |
| Sin foco visible             | Anillo de foco único y visible en las 13 paradas de tabulación |
| Sin _skip link_              | «Saltar al contenido» como primera parada                      |
| Sin landmarks                | `<main>`, `<footer>`, `<nav>` y `<section>` etiquetadas        |
| Objetivos táctiles de 22 px  | Mínimo 44 × 44 px                                              |
| Sin `prefers-reduced-motion` | Respetado; sin él, el contenido igualmente visible             |

Contrastes verificados (`npm run interactions`):

| Pareja                          | Ratio   |
| ------------------------------- | ------- |
| Cuerpo de texto sobre `#281f1d` | 6,62:1  |
| Tagline sobre `#800000`         | 5,77:1  |
| Contacto sobre `#281f1d`        | 16,10:1 |
| Texto del vídeo sobre `#800000` | 10,95:1 |

### Rendimiento

|                                 | Antes                         | Ahora                                         |
| ------------------------------- | ----------------------------- | --------------------------------------------- |
| JavaScript                      | ≈ 4,8 MB del runtime de Canva | **< 1 KB** (dos scripts propios)              |
| Formatos de imagen              | PNG/JPEG originales           | AVIF + WebP con respaldo, `srcset` y `sizes`  |
| Retrato del hero                | PNG de 2,7 MB                 | **AVIF de 28 KB** en el tamaño que se muestra |
| Embeds                          | Ambos en el arranque          | Bajo demanda, tras pulsar                     |
| Peticiones a terceros al cargar | SoundCloud, YouTube, Canva    | **cero**                                      |
| Cookies                         | de los embeds                 | **cero**                                      |
| Tipografías                     | 20 pesos de 3 familias        | 2 pesos, subconjunto latin, autoalojados      |

Se reserva `width`/`height` en todas las imágenes y se declaran
`aspect-ratio` en los huecos de los embeds, así que **no hay saltos de layout**.
El retrato del hero es el único recurso con `fetchpriority="high"` y sin
`loading="lazy"`; el resto carga en diferido.

### SEO

Se ha añadido lo que no existía: `<title>` descriptivo (el anterior estaba
cortado a mitad de palabra), `meta description`, `canonical`, `robots`,
`sitemap.xml`, Open Graph completo con `og:image` de 1200 × 630, Twitter Cards
y datos estructurados **`schema.org/Person`** con `sameAs` limitado a los cuatro
perfiles reales. El HTML es **indexable sin ejecutar JavaScript**.

### Privacidad

- El embed de SoundCloud ya **no pasa por `canva-embed.com`**: apunta al
  reproductor oficial, sin claves de API de terceros en la URL.
- YouTube se sirve desde **`youtube-nocookie.com`**.
- Ninguno de los dos contacta con nada hasta que la persona pulsa, y siempre
  queda un enlace directo a la plataforma como alternativa.
- **No se ha añadido analítica.** El sitio anterior tampoco tenía, así que no
  hay nada que preservar. Sin cookies, sin píxeles, sin banner de consentimiento.

---

## 3. Diferencias respecto a la web original

Cambios deliberados, cada uno con su motivo.

### Tipografías: sustituidas por imposibilidad legal

Canva borra la tabla `name` de los `.woff` que sirve, pero **no el Name INDEX
interno de la tabla `CFF`**. Leyéndolo se identificaron:

- **Devasia Regular** — el logotipo «PAZ».
- **Balgin ExtraLight** — todo el texto.

Ambas son **comerciales y no redistribuibles como webfont**. Soluciones:

**Logotipo.** No se embebe ninguna fuente: las tres letras van **vectorizadas**
en un SVG de ~1 KB (`src/assets/brand/wordmark-paz.svg`), extraído de los
contornos del propio render. El resultado es idéntico al original y no depende
de que cargue nada.

**Texto.** Se usa **Poppins** (SIL Open Font License), la geométrica libre más
próxima a Balgin: «a» de un solo piso, bowls casi circulares y `usWeightClass`
200 coincidente. Se autoalojan sólo los pesos 200 y 300, subconjunto latin
(≈ 8 KB cada uno), con un `@font-face` de respaldo con métricas ajustadas
(`size-adjust: 105.7%`) para que no haya salto de layout mientras carga.

> Si en algún momento se adquiere licencia web de Devasia y Balgin, basta con
> dejar los `.woff2` en `public/fonts/`, declarar sus `@font-face` en
> `src/styles/global.css` y cambiar `--font-sans`. El resto del sistema no se
> entera.

### Color de los iconos sociales: `#800000` → `#d42b2b`

**Único cambio cromático de todo el proyecto.** El rojo de marca sobre el fondo
oscuro da **1,47:1**, muy por debajo del mínimo de 3:1 que exige WCAG 1.4.11
para elementos gráficos con significado — y esos iconos son la única señal de
que hay un enlace ahí. El nuevo valor da **3,21:1** manteniendo el mismo
registro cromático.

`#800000` sigue intacto en todo lo demás: fondos del hero y del vídeo, y como
color de marca. Al pasar el ratón o enfocar, los iconos pasan a blanco.

### Texto de interfaz añadido

El original no tenía ni un botón. Las fachadas de los embeds necesitan un
nombre accesible, así que se han escrito cadenas de **interfaz**, no de
contenido editorial:

- «Reproducir «…» en SoundCloud / YouTube»
- «Abrir «…» en SoundCloud / YouTube»
- «Saltar al contenido»
- Los `h2` de sección (Biografía, Galería y últimos tracks, Sesión destacada,
  Contacto), **visualmente ocultos**: dan estructura a lectores de pantalla y
  buscadores sin alterar el diseño.
- Los nombres de plataforma en los enlaces sociales, también ocultos.

Ninguna de estas cadenas aparece como copy visible que cambie el tono del sitio.

### Añadidos a petición de PAZ (posteriores al port)

Cambios pedidos expresamente, ya fuera del criterio de «no tocar el original»:

- **Iconos sociales en el hero**, bajo la tagline. Usan el gris de la tagline
  (`#bcbcbc`, 5,8:1 sobre el rojo) en lugar del rojo elevado del bloque de
  biografía, que sobre `#800000` sólo daría 2,4:1.
- **Botón «CONTACTO»** en el hero: enlace de ancla a `#telefono`, el enlace de
  WhatsApp del pie. Al saltar, el foco cae sobre ese enlace, de modo que se
  puede continuar con el teclado.
- **Prefijo internacional en el teléfono**: pasa de `3181121845` a
  `+57 3181121845`. Es el único texto de la web que ya no coincide
  literalmente con el original.

Los cuatro enlaces sociales aparecen ahora dos veces (hero y biografía). Cada
bloque lleva un nombre accesible distinto para que no se anuncien como
duplicados.

### Ajustes de composición

| Cambio                                                 | Motivo                                                                       |
| ------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Alto del hero limitado a `100svh`                      | En el original la tagline caía bajo la línea de flotación en portátiles      |
| Lienzo con `max-width: 1425px`                         | El original estiraba el diseño hasta 1920 px y más; ahora se centra          |
| Columna de texto del vídeo del 19 % al 24 %            | A 272 px con texto de 24 px salían líneas de tres palabras                   |
| Medida de la biografía limitada a 62ch (46ch en móvil) | Legibilidad; el borde irregular a la izquierda se mantiene                   |
| Iconos sociales con tamaño óptico unificado            | El original heredaba el tamaño del bitmap de cada logo (80, 56, 60 y 88 px)  |
| Retrato con desvanecido inferior en móvil              | Al apilar aparecía un corte recto contra el rojo que en escritorio no existe |

### Embeds

- **SoundCloud** apunta al reproductor oficial en lugar del proxy de Canva.
- **YouTube** ya no arranca en `start=1363` dentro de una lista automática
  (parecía un descuido de configuración): enlaza al vídeo completo desde el
  principio. El `videoId` no cambia.
- La miniatura del vídeo se **autoaloja** en lugar de pedirla a `i.ytimg.com`.

### Enlaces que antes no lo eran

El correo y el teléfono eran texto plano. Ahora son `mailto:` y `wa.me`
(el icono de WhatsApp ya estaba en el diseño original). El logo de YIN YANG
enlaza a `yinyangcol.com`, el dominio que el propio logo muestra impreso.

### Movimiento

El original no tenía ninguna animación de contenido. Se ha añadido **una sola**:
una aparición discreta de bloques completos al entrar en viewport, de 620 ms.
Nunca elemento por elemento. Se desactiva con `prefers-reduced-motion`, y el
CSS que la aplica está condicionado a una clase que pone el propio JavaScript,
de modo que **sin JS el contenido se ve igualmente**.

---

## 4. Decisiones técnicas

**Astro y no un framework de UI.** La página es un documento, no una aplicación.
Astro genera HTML estático y sólo envía al navegador el JavaScript que se le
pide explícitamente: en este caso, menos de 1 KB.

**Tailwind sólo como capa de tokens.** El bloque `@theme` de `global.css`
concentra colores, escala tipográfica, espaciados y curvas de animación,
extraídos del sitio original. La maquetación editorial se escribe en CSS con
ámbito dentro de cada componente: para una retícula como la del mosaico es más
legible que una cadena larga de utilidades.

**Iconos en línea, sin librería.** Los siete trazados viajan dentro del HTML
(`src/data/icons.ts`). Instagram, YouTube, TikTok y WhatsApp se extrajeron de
los SVG que ya servía pazdj.com; SoundCloud, el sobre y Drive se vectorizaron
con `potrace` desde los _spritesheets_ PNG del original, porque no había SVG.
No hay peticiones adicionales ni un bundle de iconos.

> `src/data/icons.ts` es un **archivo generado**. Para regenerarlo hacen falta
> los originales de Canva (`src/assets/_download/`, que no se versiona) y el
> script de extracción. Como los iconos no van a cambiar, se versiona el
> resultado y no el proceso.

**Punto focal explícito en cada foto.** Cada imagen lleva su `object-position`
en `src/data/photos.ts`. Nada de `cover` a ciegas: al recortar para móvil, el
sujeto permanece encuadrado.

**Fachadas de embed en lugar de iframes.** Un único listener delegado para las
dos. Reserva el hueco con `aspect-ratio` (cero CLS), mueve el foco al
reproductor tras pulsar y mantiene siempre un enlace directo a la plataforma
por si alguien no quiere cargar el embed.

**Una sola copia de Vite.** `@tailwindcss/vite` arrastraba Vite 8 mientras
Astro fija `^6`, y la duplicación rompía la comprobación de tipos. Se fija
`vite: ^6.4.1` en `devDependencies` para que ambos resuelvan la misma copia.

---

## 5. Activos que no se han podido recuperar

1. **El destino de «Drive Presskit».** El elemento existe en pazdj.com como
   icono + rótulo, **sin `href`**, ni en el DOM en vivo ni en el volcado
   guardado. No hay URL que conservar, así que se reproduce tal cual: crédito de
   texto, no enlace. _Si existe un dossier en Drive, aportando la URL se
   convierte en enlace en un minuto._

2. **Los archivos de Devasia y Balgin.** Se sirven ofuscados desde el CDN de
   Canva bajo su licencia; no son redistribuibles. Documentadas en el punto 3.

3. **Analítica.** No se detectó ninguna herramienta en el sitio original, así
   que no hay implementación que documentar ni migrar.

---

## 6. Verificación

```bash
npm run verify
```

Estado en el momento de la entrega:

| Comprobación                                     | Resultado           |
| ------------------------------------------------ | ------------------- |
| `astro check` (tipos)                            | 0 errores, 0 avisos |
| ESLint + Prettier                                | limpio              |
| Build de producción                              | correcto            |
| axe-core WCAG 2.2 AA — escritorio                | 0 violaciones       |
| axe-core WCAG 2.2 AA — móvil 390 px              | 0 violaciones       |
| Auditoría propia                                 | 28/28               |
| Interacciones, contraste y enlaces               | 21/21               |
| Scroll horizontal (320, 375, 430, 1024, 1280 px) | ninguno             |
| Enlaces externos                                 | los 7 responden 200 |

### Lo que queda por medir en producción

Los objetivos de Lighthouse (95+) y de Core Web Vitals sólo son verificables
**sobre el sitio publicado**, con HTTP/2, compresión y cabeceras de caché
reales. Lo que sí está medido en local apunta en la dirección correcta: menos de
1 KB de JavaScript, cero terceros en la carga inicial, el recurso LCP en 28 KB
y ningún salto de layout. Conviene ejecutar Lighthouse contra el dominio
definitivo tras el primer despliegue.
