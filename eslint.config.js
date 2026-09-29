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

  /*
   * The `beforeBulkUpdate` hook that keeps a settled run settled writes to a property of the
   * options it is handed, and needs no inline disable to do it.
   *
   * Sequelize gives a bulk hook no return channel: it reads `options.where` back after the hook
   * runs and generates the statement from whatever it finds there
   * (`node_modules/sequelize/lib/model.js`, `update()`, around line 2010), so assigning to that
   * property is the only way the statement runs under the model's own condition rather than
   * under the caller's object.
   *
   * What is relaxed is `no-param-reassign`'s `props`, for that one file. The exception the file
   * used to take was wider by a long way — an inline disable of any rule anywhere in it, which
   * is what turning `eslint-comments/no-use` off above grants — and the one line that needed it
   * was one property assignment. Rebinding a parameter itself stays an error here, because
   * `props: false` relaxes only the assignment through one.
   */
  {
    files: [
      'sequelize/models/AiRun.js',
    ],
    rules: {
      'no-param-reassign': [
        'error',
        {
          props: false,
        },
      ],
    },
  },
]
