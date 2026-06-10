import nx from '@nx/eslint-plugin';
import baseConfig from '../../../../eslint.config.mjs';

export default [
  ...baseConfig,
  ...nx.configs['flat/angular'],
  ...nx.configs['flat/angular-template'],
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          // `landing` is the house prefix; `fx` namespaces motion/effect directives
          // (fxSpotlight, fxTypeOut) and `lightbox` is the lightbox directive's public API.
          prefix: ['landing', 'fx', 'lightbox'],
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'landing',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    // Attribute directives must alias their inputs to namespace them under the directive
    // selector (Angular's idiom for attribute directives, e.g. `lightboxGroup`,
    // `edgeFadeAxis`). no-input-rename fights that pattern, so disable it for directives.
    files: ['**/*.directive.ts'],
    rules: {
      '@angular-eslint/no-input-rename': 'off',
    },
  },
  {
    files: ['**/*.html'],
    // Override or add rules here
    rules: {},
  },
];
