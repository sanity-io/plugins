import {definePlugin, defineRule} from '@oxlint/plugins'

const CSS_MODULE_SUFFIX = '.module.css'

/**
 * Lightning CSS only tree-shakes the classes of a CSS module that the importing module actually
 * reads, and it can only see those reads through a namespace import (`import * as styles`) or
 * named imports. A default import keeps every class of the module in the bundle. The
 * `css-modules-kit` typings generated with `namedExports: true` have no default export either, so
 * the default import is also a type error there.
 */
const noCssModuleDefaultImport = defineRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow default imports from CSS modules, which Lightning CSS cannot tree-shake. Use `import * as styles` or named imports instead.',
    },
    fixable: 'code',
    messages: {
      noDefault:
        "Import '{{source}}' with `import * as {{name}} from '{{source}}'` or named imports. Lightning CSS only tree-shakes CSS modules through namespace and named imports.",
    },
    schema: [],
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        const source = node.source.value
        if (!source.endsWith(CSS_MODULE_SUFFIX)) return

        for (const specifier of node.specifiers) {
          if (specifier.type !== 'ImportDefaultSpecifier') continue

          const {name} = specifier.local
          context.report({
            node: specifier,
            messageId: 'noDefault',
            data: {source, name},
            // A namespace specifier cannot share a declaration with named specifiers, so only a
            // lone default import can be rewritten in place.
            fix:
              node.specifiers.length === 1
                ? (fixer) => fixer.replaceText(specifier, `* as ${name}`)
                : undefined,
          })
        }
      },
    }
  },
})

/**
 * [oxlint JS plugin](https://oxc.rs/docs/guide/usage/linter/js-plugins.html) with the rules the
 * shared `@sanity/plugin-kit/oxlint` config enables under the `plugin-kit/` prefix:
 *
 * - `plugin-kit/no-css-module-default-import`: CSS modules must be imported with
 *   `import * as styles` or named imports, never a default import.
 *
 * The shared config registers the plugin itself; reference this entry point from `jsPlugins` only
 * when assembling an oxlint config from scratch.
 *
 * @public
 */
const plugin = definePlugin({
  meta: {name: 'plugin-kit'},
  rules: {'no-css-module-default-import': noCssModuleDefaultImport},
})

export default plugin
