const expo = require('eslint-config-expo/flat');
const globals = require('globals');

module.exports = [
  ...expo,
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      'android/**',
      'ios/**',
      '**/build/**',
    ],
  },
  {
    // Regras novas do eslint-config-expo 57 (React Compiler). O código anterior ao SDK 57 ainda
    // tem ~117 ocorrências; ficam como aviso até a limpeza gradual das telas.
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
    },
  },
  {
    files: ['**/__tests__/**/*.{js,jsx}', '**/*.test.{js,jsx}'],
    languageOptions: { globals: { ...globals.jest, ...globals.node } },
  },
];
