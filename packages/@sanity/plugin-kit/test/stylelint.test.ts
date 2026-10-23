import stylelint from 'stylelint'
import {describe, expect, test} from 'vitest'

import config from '../src/stylelint'

/** The problems stylelint reports for a stylesheet, in source order */
async function lint(code: string): Promise<string[]> {
  const {results} = await stylelint.lint({code, codeFilename: 'Button.module.css', config})
  return results
    .flatMap((result) => result.warnings)
    .toSorted((a, b) => a.line - b.line || a.column - b.column)
    .map((warning) => `${warning.line}:${warning.column} ${warning.text}`)
}

describe('@sanity/plugin-kit/stylelint', () => {
  test('extends the recommended and CSS modules configs from this package', () => {
    expect(config.extends).toEqual([
      expect.stringMatching(/[\\/]stylelint-config-recommended[\\/]/),
      expect.stringMatching(/[\\/]stylelint-config-css-modules[\\/]/),
    ])
  })

  test('accepts CSS modules syntax, scoped container names and view transitions', async () => {
    expect(
      await lint(`
        .button {
          composes: reset from './reset.module.css';
          container: toolbar / inline-size;
        }
        :global(.dark) .button:local(.pressed) {
          color: inherit;
        }
        ::view-transition-new(.slideIn) {
          animation-name: slideIn;
        }
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
        }
        @container toolbar (min-width: 260px) {
          .button {
            display: block;
          }
        }
      `),
    ).toEqual([])
  })

  test('reports what a browser would drop silently', async () => {
    expect(
      await lint(`
        .button {
          colr: red;
          color: #ff00zz;
          opacity: 0.5;
          opacity: 0.6;
        }
      `),
    ).toEqual([
      '3:11 Unknown property "colr" (property-no-unknown)',
      '4:18 Unknown value "#ff00zz" for property "color" (declaration-property-value-no-unknown)',
      '5:11 Duplicate property "opacity" (declaration-block-no-duplicate-properties)',
    ])
  })

  test('reports CSS that does not parse', async () => {
    expect(await lint('.button {\n  opacity: 0.6;\n')).toEqual([
      '1:1 Unclosed block (CssSyntaxError)',
    ])
  })
})
