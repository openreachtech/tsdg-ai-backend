import globals from 'globals'

import {
  default as openreachtechConfig,
  coreRuleOptionHash,
} from '@openreachtech/eslint-config'

export default [
  ...openreachtechConfig,

  {
    ignores: [
      'trials/**',
    ],
  },

  {
    rules: {
      'no-shadow': [
        'error',
        {
          allow: [
            ...coreRuleOptionHash['no-shadow'].allow,
            ...Object.keys(globals.browser),
          ],
        },
      ],
    },
  },

  // Turn off some rules for specific files
  {
    // 🚨 Never add other files to this files.
    files: [
      'server/graphql/AdminGraphqlServerEngine.js',
      'server/graphql/CustomerGraphqlServerEngine.js',
      'server/restfulapi/AppRestfulApiServerEngine.js',

      /*
       * A Template-Pattern base class at the root of its hierarchy. The class convention permits
       * one that holds no state while its subclasses do; the `no-restricted-syntax` selector
       * cannot express that exception, because it fires on any root class with no constructor
       * assigning to `this` — which is exactly what such a base looks like. The file carries one
       * inline disable, for that one rule, with the reasoning beside it.
       */
      'app/tools/BaseAiModelProcessor.js',
    ],
    rules: {
      'eslint-comments/no-use': 'off',
      'eslint-comments/require-description': 'off',
    },
  },
]
