const expo = require('eslint-config-expo/flat');

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
];
