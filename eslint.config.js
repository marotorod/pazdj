import js from '@eslint/js';
import ts from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import globals from 'globals';

export default [
  {
    ignores: [
      'dist/**',
      '.astro/**',
      'node_modules/**',
      'src/assets/**',
      'screenshots/**',
      // Utilidad de volcado del sitio original, ajena a la app.
      'tools/**',
    ],
  },
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...astro.configs.recommended,
  {
    // Código que se ejecuta en el navegador: páginas, componentes y layouts.
    files: ['src/**/*.{astro,ts}'],
    languageOptions: {
      globals: { ...globals.browser },
    },
  },
  {
    // Utilidades de desarrollo: corren en Node y evalúan código en la página.
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['*.config.{js,mjs}'],
    languageOptions: { globals: { ...globals.node } },
  },
];
