/**
 * Fotografías originales de pazdj.com.
 *
 * Todas se descargaron del sitio original en su máxima resolución disponible;
 * no hay stock ni imágenes generadas. Para sustituir una foto basta con dejar
 * el archivo nuevo en `src/assets/photos/` y cambiar el import de abajo:
 * Astro regenera solo los tamaños, AVIF/WebP y el srcset.
 *
 * `focus` es el `object-position` que se aplica cuando la foto se recorta,
 * para que el sujeto nunca quede fuera del encuadre en móvil.
 */
import type { ImageMetadata } from 'astro';

import heroRetrato from '../assets/photos/paz-hero-retrato.png';
import cabina from '../assets/photos/paz-cabina.jpg';
import barandilla from '../assets/photos/paz-barandilla.jpg';
import retratoGorro from '../assets/photos/paz-retrato-gorro.jpg';
import pioneerExterior from '../assets/photos/paz-pioneer-exterior.jpg';
import retratoRojo from '../assets/photos/paz-retrato-rojo.jpg';
import setupPioneer from '../assets/photos/paz-setup-pioneer.jpg';

export interface Photo {
  src: ImageMetadata;
  alt: string;
  focus: string;
  /** Opacidad del original, cuando forma parte del tratamiento visual. */
  opacity?: number;
}

/** Retrato principal del hero (PNG con transparencia, duotono sobre el rojo). */
export const hero: Photo = {
  src: heroRetrato,
  alt: 'Retrato de PAZ de perfil, con la mano bajo el mentón, en duotono rojo.',
  focus: '50% 18%',
};

/** Mosaico de la sección de galería, en el orden del sitio original. */
export const gallery: readonly Photo[] = [
  {
    src: cabina,
    alt: 'PAZ mezclando en la cabina de un club, vista entre dos columnas.',
    focus: '50% 40%',
  },
  {
    src: barandilla,
    alt: 'PAZ apoyada en una barandilla de madera, en exteriores, en blanco y negro.',
    focus: '50% 30%',
  },
  {
    src: retratoGorro,
    alt: 'Retrato de PAZ con gorro y camisa blanca, en blanco y negro.',
    focus: '50% 25%',
  },
  {
    src: pioneerExterior,
    alt: 'PAZ con gafas de sol frente a una controladora Pioneer DJ al aire libre.',
    focus: '50% 45%',
    opacity: 0.66,
  },
  {
    src: retratoRojo,
    alt: 'Retrato de PAZ sobre un fondo rojo intenso.',
    focus: '50% 30%',
    opacity: 0.71,
  },
];

/**
 * Textura de fondo de las secciones de sesión destacada y contacto.
 * En el original se usa la misma foto al 14 % de opacidad en ambas.
 */
export const texture = {
  src: setupPioneer,
  /** Decorativa: el sujeto ya está descrito en la galería. */
  alt: '',
  opacity: 0.14,
} as const;
