import {RuleTester} from 'oxlint/plugins-dev'
import {describe, it} from 'vitest'

import plugin from './oxlint-plugin'

RuleTester.describe = describe
RuleTester.it = it

const ruleTester = new RuleTester({languageOptions: {parserOptions: {lang: 'ts'}}})

ruleTester.run('no-css-module-default-import', plugin.rules['no-css-module-default-import'], {
  valid: [
    "import * as styles from './ThemeCard.module.css'",
    "import {root, title} from './ThemeCard.module.css'",
    "import {root as rootClass} from './ThemeCard.module.css'",
    "import type * as styles from './ThemeCard.module.css'",
    "import './global.css'",
    "import styles from './global.css'",
    "import styles from './styles.module.scss'",
    "import styles from './ThemeCard.module.css.ts'",
    "import styles from 'module.css'",
  ],
  invalid: [
    {
      code: "import styles from './ThemeCard.module.css'",
      output: "import * as styles from './ThemeCard.module.css'",
      errors: [
        {
          messageId: 'noDefault',
          data: {source: './ThemeCard.module.css', name: 'styles'},
          // the report covers the `styles` specifier only (0-based columns)
          line: 1,
          column: 7,
          endLine: 1,
          endColumn: 13,
        },
      ],
    },
    {
      code: "import classes from '@sanity/themer/styles.module.css'",
      output: "import * as classes from '@sanity/themer/styles.module.css'",
      errors: [
        {
          messageId: 'noDefault',
          data: {source: '@sanity/themer/styles.module.css', name: 'classes'},
        },
      ],
    },
    {
      code: "import type styles from './ThemeCard.module.css'",
      output: "import type * as styles from './ThemeCard.module.css'",
      errors: [{messageId: 'noDefault'}],
    },
    {
      name: 'a default import next to named imports has no single-declaration fix',
      code: "import styles, {root} from './ThemeCard.module.css'",
      output: null,
      errors: [{messageId: 'noDefault', data: {source: './ThemeCard.module.css', name: 'styles'}}],
    },
  ],
})
