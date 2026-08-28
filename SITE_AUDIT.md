# SITE_AUDIT.md — Inventario de pazdj.com antes del rediseño

Auditoría del sitio en producción `https://pazdj.com/`, realizada sobre el DOM
renderizado (no sólo el HTML inicial) con navegador real, más el volcado
completo de la página guardado en `../../PAZ es una DJ colombiana…_files/`.

**Dato de partida más importante:** pazdj.com **no es una web responsive**. Es
una exportación de **Canva Sites** (`<meta name="app-name" content="export_website">`).
Cada sección es un lienzo de tamaño fijo con todos los elementos en
`position: absolute`, y el conjunto se **escala linealmente** con el ancho del
viewport. No hay reflujo: en móvil no se recoloca nada, sólo se encoge.

---

## 1. Estructura actual de la página

Una sola página, sin menú ni navegación interna. Cinco `<section>` apiladas,
todas del mismo ancho de lienzo (1425 px de referencia):

| #   | Sección                  | Lienzo     | Proporción alto/ancho | Fondo     |
| --- | ------------------------ | ---------- | --------------------- | --------- |
| 1   | Hero                     | 1425 × 881 | 0,618                 | `#800000` |
| 2   | Biografía + redes        | 1425 × 714 | 0,501                 | `#281f1d` |
| 3   | Galería + SoundCloud     | 1425 × 743 | 0,521                 | `#281f1d` |
| 4   | Sesión destacada (vídeo) | 1425 × 584 | 0,410                 | `#800000` |
| 5   | Contacto y créditos      | 1425 × 304 | 0,213                 | `#281f1d` |

No existen: cabecera, menú, hamburguesa, anclas, breadcrumbs, agenda de
eventos, prensa, formulario de booking ni página secundaria alguna.

### Geometría original (extraída del DOM, lienzo de 1425 px)

**Sección 1 — Hero**

- Retrato: caja 820,4 × 916,9 en `translate(67,76 , −31,52)`, **opacidad 0,78**,
  recortado con `clip-path` entre x = 67,76 y x = 888,12.
- «PAZ»: en `translate(921,41 , 291,10)`, `font-size` 167,204 px con
  `scale(1,65507)` → **276,7 px de cuerpo**; altura de caja alta **189,2 px**.
- Tagline: en `translate(728,83 , 571,32)`, 38,47 px × `scale(0,867)` → 33,4 px.

**Sección 2 — Biografía**

- Texto: caja 799,7 × 708,5 en `translate(533,12 , 29,77)`, alineado a la derecha.
- Iconos sociales, columna vertical en x ≈ 214–238:
  Instagram 80,0 × 80,0 (y 50,3) · SoundCloud 120,1 × 56,1 (y 239,4) ·
  YouTube 87,5 × 59,6 (y 404,5) · TikTok 87,5 × 87,5 (y 582,3).

**Sección 3 — Galería**

- Retícula de módulos de 216,6 px con medianil de 14,7 px.
- `57626e5d` 216,6 × 456,7 (95,2 , 41,1) — vertical, dos filas
- `b0e22bfd` 220,6 × 220,6 (326,6 , 43,8) — cuadrada
- `c9272c50` 243,0 × 450,6 (563,9 , 272,5) — vertical, dos filas
- `101d28ef` 216,6 × 216,6 (95,2 , 510,3) — **opacidad 0,66**
- `c4deb21e` 216,6 × 216,6 (326,6 , 510,3) — **opacidad 0,71**
- Widget SoundCloud 489,3 × 367,0 (839,3 , 43,8)
- Letras sueltas «P» (563,9 , 41,1), «4» (326,6 , 272,5), «Z» (530,3 , 470,7)

**Sección 4 — Vídeo**

- Fondo `6b5ffbad` a 1425 × 1068,75 en `translate(0 , −472,14)`, **opacidad 0,14**.
- Iframe de YouTube 943,8 × 530,5 (371,8 , 28,2).
- Texto: caja 272,4 × 529,9 (78,5 , 26,4), alineado a la derecha, 24,1 px.

**Sección 5 — Contacto**

- Mismo fondo `6b5ffbad` en `translate(0 , −540,94)`, **opacidad 0,14**.
- Bloque de contacto 955,1 × 99,6 (234,9 , 96,4), centrado, 30,0 px.
- Icono de sobre (465,3 , 133,8) · icono de WhatsApp (603,1 , 161,7).
- «diseño:» (666,3 , 253,3) a 13,9 px · logo YIN YANG 122,0 × 24,1 (632,2 , 269,8).
- «Drive Presskit»: icono 49,4 × 49,4 (1233,5 , 218,3) + texto (1216,5 , 272,7).

---

## 2. Todos los textos

Reproducidos literalmente, con su ortografía, acentuación y mayúsculas.

**Hero**

> PAZ
>
> ... Is the Only Revolution.

**Biografía** (cuatro párrafos)

> PAZ es una DJ colombiana cuya conexión con la música electrónica nació desde la infancia, rodeada por una familia apasionada por la cultura rave y el Detroit Techno. Ese entorno marcó el inicio de una identidad artística que hoy continúa en constante evolución.
>
> Su propuesta se mueve entre el Techno, Peak Time, Hardgroove y Psytrance, enriquecida por influencias del Progressive, el Indie y la música clásica. Cada sesión combina atmósferas, texturas y una narrativa sonora cuidadosamente construida, donde la técnica y la experimentación son protagonistas.
>
> Ha llevado su sonido a algunos de los principales clubes especializados en música electrónica de Bogotá, además de participar en streamings y presentaciones en diferentes ciudades del país. Su dominio de tres o más decks y el uso creativo de la Pioneer RMX-1000 le permiten desarrollar sets dinámicos y una identidad sonora propia.
>
> Actualmente, PAZ continúa explorando nuevos sonidos y trabajando en sus primeras producciones originales, consolidando un proyecto artístico que comienza a captar la atención de la escena underground colombiana.

**Galería** — sólo tres caracteres decorativos sueltos: `P`, `4`, `Z`.

**Sesión destacada**

> PAZ en REConecta2 #345 de REC Emisora, uno de los espacios más emblemáticos de la escena electrónica de la capital colombiana. Un set cargado de groove, energía y contundencia, que mantiene la esencia de PAZ de principio a fin. Un recorrido pistero, dinámico y pensado para el dancefloor.

**Contacto**

> CONTACTO:
> mariapazmendezespinosa@gmail.com
> 3181121845

**Créditos**

> diseño: · [logo YIN YANG] · Drive Presskit

No hay titulares (`h1`–`h6`), ni CTAs, ni botones, ni pie de página adicional.

---

## 3. Enlaces

| Destino                                     | Origen | `target` | `rel`               |
| ------------------------------------------- | ------ | -------- | ------------------- |
| `https://www.instagram.com/_paz_x_mendez_`  | icono  | `_blank` | `noopener nofollow` |
| `https://soundcloud.com/pazxmendezx`        | icono  | `_blank` | `noopener nofollow` |
| `https://www.youtube.com/@paz-dj`           | icono  | `_blank` | `noopener nofollow` |
| `https://www.tiktok.com/@paz__mendez_?_r=1` | icono  | `_blank` | `noopener nofollow` |

Los cuatro son **enlaces sin texto ni `aria-label`**: para un lector de pantalla
no tienen nombre accesible.

El correo y el teléfono aparecen como **texto plano, sin `mailto:` ni `tel:`**.
El logo de YIN YANG y el rótulo «Drive Presskit» **no enlazan a ningún sitio**.

---

## 4. Redes sociales y plataformas

- Instagram — `_paz_x_mendez_`
- SoundCloud — `pazxmendezx`
- YouTube — `@paz-dj`
- TikTok — `@paz__mendez_`

No hay Spotify, Bandcamp, Beatport, Mixcloud, RA ni Linktree.

**Embeds de terceros:**

- SoundCloud, a través del proxy `canva-embed.com/api/iframe?url=…` con una
  clave de API de Canva incrustada en la URL.
- YouTube: `youtube-nocookie.com/embed/6caJfarM1T0?list=RD6caJfarM1T0&start=1363`.
  Título real del vídeo: «RECOnecta2 # 345 - PAZ», del canal
  «REC Radio Electronica colombiana».

---

## 5. Fotografías y archivos utilizados

Todos recuperados en la mayor resolución disponible y guardados en
`src/assets/photos/` con nombres descriptivos.

| Archivo original                       | Resolución  | Uso                                               | Nombre nuevo               |
| -------------------------------------- | ----------- | ------------------------------------------------- | -------------------------- |
| `04080ad2ee31a07b8ff083201553196d.png` | 1799 × 2399 | Retrato del hero (PNG con transparencia, duotono) | `paz-hero-retrato.png`     |
| `57626e5d47e719809f2b26ffe9ee4ab5.jpg` | 729 × 1148  | Galería — en cabina                               | `paz-cabina.jpg`           |
| `b0e22bfd5c9bb1ab8dabe860c8a25be8.jpg` | 533 × 800   | Galería — barandilla                              | `paz-barandilla.jpg`       |
| `c9272c5083c4595d8dde8bfdf42d79d4.jpg` | 1200 × 1600 | Galería — retrato con gorro                       | `paz-retrato-gorro.jpg`    |
| `101d28efd25d419c23290b54dbdbf32f.jpg` | 800 × 600   | Galería — Pioneer en exterior                     | `paz-pioneer-exterior.jpg` |
| `c4deb21e7354af8ab7e968436ab96979.jpg` | 599 × 799   | Galería — retrato rojo                            | `paz-retrato-rojo.jpg`     |
| `6b5ffbadfbe98e296117c7305e74fb80.jpg` | 1280 × 960  | Textura de fondo (secciones 4 y 5)                | `paz-setup-pioneer.jpg`    |
| `dc6b3a45b49ba45fec32cd1dc669762f.png` | 796 × 157   | Logo YIN YANG                                     | `brand/yinyang.png`        |

**Iconos** (Canva los sirve como SVG sueltos o como _spritesheets_ PNG):

| Original       | Formato           | Icono                                                     |
| -------------- | ----------------- | --------------------------------------------------------- |
| `8ab3c029…svg` | SVG, 212 × 212    | Instagram                                                 |
| `0106c59f…svg` | SVG, 590 × 131    | Logotipo completo de YouTube (sólo se muestra el _badge_) |
| `7867b31c…svg` | SVG, 225 × 225    | TikTok a todo color, con fondo negro                      |
| `115a1781…svg` | SVG, 201 × 202    | WhatsApp                                                  |
| `ef59f2e5…png` | Spritesheet 2 × 1 | SoundCloud                                                |
| `eda192e0…png` | Spritesheet 3 × 2 | Sobre de correo                                           |
| `ca6d844a…png` | Spritesheet 3 × 3 | Google Drive                                              |

**Favicons:** `2bb646b0…png` (32), `a274a5d3…png` (192), `26f9252b…png` (180).

**Duplicados a menor resolución** presentes en el sitio y descartados:
`fc4e3569…png` (1199 × 1599, versión reducida del retrato del hero),
`d0cfdb5c…jpg` (600 × 800) y `4214a856…jpg` (508 × 800).

**No hay vídeo autoalojado**: el único vídeo es el embed de YouTube.

---

## 6. Paleta de colores

Muestreada del DOM y verificada píxel a píxel sobre la captura de pantalla.

| Color     | Uso                                                                                 |
| --------- | ----------------------------------------------------------------------------------- |
| `#800000` | Rojo de marca: fondo del hero y de la sección de vídeo, iconos sociales             |
| `#281f1d` | Marrón muy oscuro: fondo de biografía, galería y contacto; color del logotipo «PAZ» |
| `#a6a6a6` | Cuerpo de texto de la biografía y letras decorativas                                |
| `#bcbcbc` | Tagline                                                                             |
| `#ffffff` | Texto del vídeo, bloque de contacto y créditos                                      |

Las secciones 4 y 5 muestran variaciones (`#88211c`, `#760a06`, `#332c2b`) que
no son colores propios: son el resultado de la fotografía de fondo al 14 %
sobre el rojo o el marrón.

---

## 7. Tipografías

Canva **borra la tabla `name`** de los `.woff` que sirve, así que los nombres de
familia en CSS son identificadores ofuscados (`YADZ-WrNjFY_0`, `YAEKEocEjoI_0`).
Las tipografías reales se identificaron leyendo el **Name INDEX interno de la
tabla `CFF`**, que Canva no llega a limpiar:

| Papel          | Archivo servido | Tipografía real       | Métricas                                                                                                                      |
| -------------- | --------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Logotipo «PAZ» | `7b1eb5b4…woff` | **Devasia Regular**   | 1024 upem · caja alta 700 (68,4 %) · relación ancho/alto de la «H» = **0,293** (didona ultracondensada de altísimo contraste) |
| Todo el texto  | `e735728d…woff` | **Balgin ExtraLight** | 1000 upem · `usWeightClass` 200 · altura de x 534 · «O» casi circular (0,967) · «a» de un solo piso                           |

Ambas son **comerciales y no redistribuibles**. Ver `MIGRATION.md` para las
sustituciones adoptadas.

La tercera familia detectada (`YAFdJt8dAY0_0`, en «Drive Presskit») pertenece al
widget de Google, no al diseño.

---

## 8. Tamaños y jerarquía tipográfica

Sobre el lienzo de 1425 px. La columna «% del ancho» es lo que permite convertir
la escala fija en escala fluida.

| Elemento        | Tamaño                     | % del ancho | Interlineado  | Color     | Alineación  |
| --------------- | -------------------------- | ----------- | ------------- | --------- | ----------- |
| Logotipo «PAZ»  | 276,7 px (caja alta 189,2) | 13,28 %     | 234 px        | `#281f1d` | centrado    |
| Tagline         | 33,4 px                    | 2,34 %      | 1,38          | `#bcbcbc` | centrado    |
| Biografía       | 22,67 px                   | 1,59 %      | 31 px (1,367) | `#a6a6a6` | **derecha** |
| Texto del vídeo | 24,1 px                    | 1,69 %      | 33 px (1,386) | `#ffffff` | **derecha** |
| Contacto        | 30,0 px                    | 2,10 %      | 32 px (1,067) | `#ffffff` | centrado    |
| Letras «P 4 Z»  | 23,2 px                    | 1,63 %      | —             | `#a6a6a6` | —           |
| «diseño:»       | 13,9 px                    | 0,98 %      | 37 px         | `#ffffff` | izquierda   |

Ningún elemento usa `letter-spacing` ni `text-transform`. Todo el texto va en
peso 400 (que en Balgin ExtraLight corresponde a un trazo muy fino).

---

## 9. Espaciados

No hay sistema de espaciado: cada elemento está colocado por coordenadas
absolutas. Los únicos valores que se repiten y sí constituyen un ritmo son:

- **Margen lateral** de la galería: 95,2 px = **6,68 %** del ancho.
- **Medianil** de la retícula de galería: 14,7 px = **1,03 %**.
- **Módulo** de la galería: 216,6 px = **15,20 %**.

---

## 10. Botones y enlaces

**No hay ninguno.** No existen botones, ni CTAs, ni enlaces de texto. La única
interacción son los cuatro iconos sociales, que no tienen estado `:hover`,
ni `:focus`, ni transición, ni subrayado, ni indicación visual alguna de ser
pulsables.

---

## 11. Comportamiento del menú

No hay menú. No hay cabecera, ni hamburguesa, ni navegación por anclas.

---

## 12. Animaciones y transiciones

**El contenido no tiene ninguna.** Los `@keyframes` y `transition` que aparecen
en el CSS pertenecen al _runtime_ de Canva (spinners de carga, cromo del
reproductor de vídeo) y nunca se aplican a elementos de la página. Los elementos
posicionados (`.DF_utQ._0xkaeQ`) sólo declaran `position: absolute`,
`pointer-events` y `contain: size`.

No hay aparición al hacer scroll, ni parallax, ni efectos de hover.

---

## 13. Estructura en escritorio

El lienzo se centra y crece hasta ocupar el ancho disponible. A 1440 px de
viewport la composición mide 1425 px de ancho y **3 528 px de alto**.

---

## 14. Estructura en móvil

**Idéntica a la de escritorio, escalada.** Las proporciones de las cinco
secciones son las mismas a 390 px que a 1920 px; el documento entero mide
**956 px de alto en un móvil de 390 px**. Consecuencias medidas:

- El cuerpo de la biografía queda en **≈ 6 px**.
- La columna de texto del vídeo queda en **≈ 75 px de ancho** con texto de ≈ 6 px.
- Los iconos sociales quedan en **≈ 22 px**, muy por debajo de cualquier
  objetivo táctil razonable.
- Toda la página cabe en pantalla y media: no hay contenido legible.

---

## 15. Elementos visuales distintivos de la marca

1. El binomio cromático **rojo sangre `#800000` / marrón casi negro `#281f1d`**.
2. El logotipo **«PAZ»** en didona ultracondensada, en `#281f1d` sobre el rojo:
   un contraste deliberadamente bajo que hace que el nombre «se hunda» en el fondo.
3. El **retrato en duotono al 78 %**, dejando que el rojo respire a través.
4. La **alineación a la derecha** de la biografía y del texto del vídeo.
5. El **mosaico de fotografías** en blanco y negro, con dos de ellas
   deliberadamente **desvanecidas** (0,66 y 0,71).
6. Las **letras sueltas «P», «4», «Z»** repartidas por el espacio negativo del
   mosaico: un guiño gráfico a «P4Z».
7. La **fotografía de textura al 14 %** que unifica las dos secciones inferiores.
8. El **espacio negativo abundante** y la ausencia total de adornos.

---

## Elementos que deben conservarse obligatoriamente

- **Contenido literal**: los cuatro párrafos de la biografía, la tagline
  `... Is the Only Revolution.`, el texto de la sesión destacada, el rótulo
  `CONTACTO:`, el correo y el teléfono, y el crédito `diseño: YIN YANG`.
- **Las siete fotografías originales**, sin sustituir ni recortar el sujeto.
- **La paleta exacta**: `#800000`, `#281f1d`, `#a6a6a6`, `#bcbcbc`, `#ffffff`.
- **El logotipo «PAZ»** con su forma tipográfica reconocible y su color `#281f1d`
  sobre el rojo.
- **El orden de las cinco secciones.**
- **La alineación a la derecha** de la biografía y del texto del vídeo.
- **Las opacidades** que forman parte del tratamiento: 0,78 (retrato),
  0,14 (textura), 0,66 y 0,71 (dos fotos del mosaico).
- **Las letras decorativas «P 4 Z»** en el mosaico.
- **Los cuatro destinos sociales**, el vídeo de YouTube y el perfil de SoundCloud.
- **El logo de YIN YANG** y el rótulo «Drive Presskit».
- **Los favicons** originales.

---

## Problemas UX/técnicos detectados

### Bloqueantes

1. **No es responsive.** Escalar en lugar de recolocar deja el cuerpo de texto
   en ~6 px en móvil. Es, con diferencia, el problema más grave del sitio.
2. **Objetivos táctiles inutilizables**: los iconos sociales miden ~22 px en móvil.
3. **Sin ningún titular.** No hay un solo `h1`–`h6` en toda la página: la
   estructura del documento es plana para buscadores y lectores de pantalla.
4. **Enlaces sin nombre accesible.** Los cuatro iconos sociales son enlaces
   vacíos: un lector de pantalla anuncia «enlace» sin más.
5. **Imágenes sin `alt`.** Ninguna de las once imágenes tiene texto alternativo.

### SEO

6. **Sin `meta description`**, sin `canonical`, sin `og:image`, sin
   `og:description`, sin Twitter Cards, sin `sitemap.xml`, sin datos
   estructurados.
7. **`<title>` roto**: «PAZ es una DJ colombiana de la escena underground, con un
   sonido que f» — una frase cortada a mitad de palabra.
8. **Contenido dependiente de JavaScript**: el HTML inicial no contiene el texto;
   todo lo pinta el runtime de Canva.

### Rendimiento

9. **≈ 4,8 MB de JavaScript de Canva** para servir una página estática
   (`68ead46d…js` 2,85 MB, `base.js` 1,6 MB, más _vendors_ y _widgets_).
10. **Ambos embeds se cargan en el arranque**, antes de que nadie pida
    reproducir nada.
11. **Imágenes sin optimizar**: PNG/JPEG originales, sin AVIF ni WebP, sin
    `srcset`, sin `loading="lazy"`, sin `width`/`height` declarados.
12. **Veinte pesos tipográficos descargados** de tres familias distintas para
    usar, en la práctica, dos.

### Accesibilidad

13. **Sin foco visible** en ningún elemento interactivo.
14. **Sin _skip link_**.
15. **Iconos sociales a 1,47:1** de contraste sobre el fondo oscuro: incumplen
    el mínimo de 3:1 de WCAG 1.4.11.
16. **Sin soporte de `prefers-reduced-motion`** (irrelevante aquí porque no hay
    animaciones, pero los embeds sí se mueven).

### Privacidad

17. **El embed de SoundCloud pasa por `canva-embed.com`**, un intermediario
    ajeno tanto a PAZ como a SoundCloud, con una clave de API expuesta en la URL.
18. No se detectó Google Analytics, Meta Pixel ni ninguna otra herramienta de
    analítica: **el sitio no tiene analítica que preservar**.

---

## Incidencias documentadas (contenido ambiguo u obsoleto)

Siguiendo el criterio de conservar y documentar, sin inventar alternativas:

1. **«Drive Presskit» no enlaza a ningún sitio.** Es un icono de Google Drive
   más un rótulo, sin `href` ni destino recuperable, ni en el DOM en vivo ni en
   el volcado guardado. Se conserva **tal cual, como crédito de texto**. Si
   existe un dossier de prensa en Drive, hay que aportar la URL.
2. **El embed de YouTube apuntaba a `?list=RD6caJfarM1T0&start=1363`**, es decir,
   arrancaba el vídeo en el minuto 22:43 dentro de una lista de reproducción
   automática. Parece un descuido de configuración. La nueva versión enlaza al
   vídeo completo desde el principio; el `videoId` no cambia.
3. **El `<title>` está cortado a mitad de frase.** Se ha sustituido por un
   título descriptivo construido con las palabras de la propia biografía.
4. **El teléfono aparece sólo como número**, sin prefijo internacional. Se
   conserva la presentación `3181121845` y se añade `+57` únicamente en el
   destino técnico de los enlaces `tel:`/`wa.me`.
5. **El logo de YIN YANG incluye `www.yinyangcol.com` impreso en el propio
   mapa de bits**, pero en el original no es un enlace. Se ha convertido en
   enlace al dominio que el propio logo muestra.
6. **No hay sección de eventos ni fechas.** No se ha añadido: no existe dato
   real que estructurar, y por eso tampoco hay `schema.org/Event`.
