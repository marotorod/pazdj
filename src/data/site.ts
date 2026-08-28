/**
 * Única fuente de verdad del contenido del sitio.
 *
 * Todos los textos provienen literalmente de pazdj.com (idioma, mayúsculas,
 * acentos y puntuación incluidos). No añadas copy nuevo aquí: si algo debe
 * cambiar, cámbialo porque PAZ lo ha pedido, no por criterio editorial.
 */

export type SocialId = 'instagram' | 'soundcloud' | 'youtube' | 'tiktok';

export interface SocialLink {
  id: SocialId;
  /** Nombre accesible del enlace (no se muestra visualmente). */
  label: string;
  href: string;
}

export const site = {
  name: 'PAZ',
  url: 'https://pazdj.com',
  locale: 'es-CO',
  lang: 'es',
  /** Se usa en <title> y og:title. */
  title: 'PAZ — DJ colombiana de techno, hardgroove y psytrance',
  /**
   * Meta description: resumen de la biografía existente, sin claims nuevos.
   */
  description:
    'PAZ es una DJ colombiana de la escena underground. Techno, Peak Time, Hardgroove y Psytrance en los principales clubes de música electrónica de Bogotá.',
  tagline: '... Is the Only Revolution.',
} as const;

/** Biografía — texto literal de pazdj.com, un elemento por párrafo. */
export const bio: readonly string[] = [
  'PAZ es una DJ colombiana cuya conexión con la música electrónica nació desde la infancia, rodeada por una familia apasionada por la cultura rave y el Detroit Techno. Ese entorno marcó el inicio de una identidad artística que hoy continúa en constante evolución.',
  'Su propuesta se mueve entre el Techno, Peak Time, Hardgroove y Psytrance, enriquecida por influencias del Progressive, el Indie y la música clásica. Cada sesión combina atmósferas, texturas y una narrativa sonora cuidadosamente construida, donde la técnica y la experimentación son protagonistas.',
  'Ha llevado su sonido a algunos de los principales clubes especializados en música electrónica de Bogotá, además de participar en streamings y presentaciones en diferentes ciudades del país. Su dominio de tres o más decks y el uso creativo de la Pioneer RMX-1000 le permiten desarrollar sets dinámicos y una identidad sonora propia.',
  'Actualmente, PAZ continúa explorando nuevos sonidos y trabajando en sus primeras producciones originales, consolidando un proyecto artístico que comienza a captar la atención de la escena underground colombiana.',
];

export const socials: readonly SocialLink[] = [
  { id: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/_paz_x_mendez_' },
  { id: 'soundcloud', label: 'SoundCloud', href: 'https://soundcloud.com/pazxmendezx' },
  { id: 'youtube', label: 'YouTube', href: 'https://www.youtube.com/@paz-dj' },
  { id: 'tiktok', label: 'TikTok', href: 'https://www.tiktok.com/@paz__mendez_?_r=1' },
];

const PHONE_E164 = '+573181121845'; // Colombia (+57). El original sólo mostraba el número nacional.

export const contact = {
  email: 'mariapazmendezespinosa@gmail.com',
  /** Tal y como aparece en el sitio original: sin prefijo. */
  phoneDisplay: '3181121845',
  /** Formato E.164, única fuente del destino de WhatsApp. */
  phoneE164: PHONE_E164,
  whatsapp: `https://wa.me/${PHONE_E164.replace('+', '')}`,
} as const;

/** Sesión destacada. El texto es literal del sitio original. */
export const featuredSet = {
  videoId: '6caJfarM1T0',
  /** Título real del vídeo en YouTube, usado como nombre accesible. */
  videoTitle: 'RECOnecta2 # 345 - PAZ',
  channel: 'REC Radio Electrónica colombiana',
  watchUrl: 'https://www.youtube.com/watch?v=6caJfarM1T0',
  caption:
    'PAZ en REConecta2 #345 de REC Emisora, uno de los espacios más emblemáticos de la escena electrónica de la capital colombiana. Un set cargado de groove, energía y contundencia, que mantiene la esencia de PAZ de principio a fin. Un recorrido pistero, dinámico y pensado para el dancefloor.',
} as const;

export const soundcloud = {
  profileUrl: 'https://soundcloud.com/pazxmendezx',
  /** Player oficial de SoundCloud; sólo se carga tras interacción. */
  embedUrl:
    'https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/pazxmendezx&color=%23800000&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false',
} as const;

/**
 * Crédito de diseño del sitio original. "Drive Presskit" aparece en pazdj.com
 * como texto + icono SIN enlace: no existe URL de destino que conservar.
 */
export const credits = {
  designer: 'YIN YANG',
  designerUrl: 'https://yinyangcol.com',
  product: 'Drive Presskit',
  label: 'diseño:',
} as const;
