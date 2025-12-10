import type {PlopTypes} from '@turbo/gen'

import validateNpmPackageName from 'validate-npm-package-name'

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.setGenerator('new plugin', {
    description: 'Generates a new Sanity Studio plugin',

    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'What is the name of the plugin?',
        validate: (input: string) => {
          if (!input) {
            return 'file name is required'
          }
          const {errors} = validateNpmPackageName(input)
          if (errors?.length) {
            return errors.join(', ')
          }
          if (input.startsWith('@') && !input.startsWith('@sanity/')) {
            return 'only the @sanity scope is allowed'
          }

          return true
        },
      },
      {
        type: 'input',
        name: 'description',
        message:
          'What is the description of the plugin? This is used both as the `description` field in the `package.json` and the `README.md` intro.',
      },
      {
        type: 'input',
        name: 'version',
        message: 'What is the version of the plugin?',
        default: async () => '0.0.1',
      },
    ],
    actions: [
      {
        type: 'add',
        path: '{{ turbo.paths.root }}/plugins/{{ name }}/README.md',
        templateFile: 'templates/README.md.hbs',
      },
      {
        type: 'add',
        path: '{{ turbo.paths.root }}/plugins/{{ name }}/src/index.ts',
        templateFile: 'templates/src/index.ts.hbs',
      },
      {
        type: 'add',
        path: '{{ turbo.paths.root }}/plugins/{{ name }}/src/plugin.tsx',
        templateFile: 'templates/src/plugin.tsx.hbs',
      },
      {
        type: 'add',
        path: '{{ turbo.paths.root }}/plugins/{{ name }}/eslint.config.js',
        templateFile: 'templates/eslint.config.js.hbs',
      },
      {
        type: 'add',
        path: '{{ turbo.paths.root }}/plugins/{{ name }}/package.config.ts',
        templateFile: 'templates/package.config.ts.hbs',
      },
      {
        type: 'add',
        path: '{{ turbo.paths.root }}/plugins/{{ name }}/package.json',
        templateFile: 'templates/package.json.hbs',
      },
      {
        type: 'add',
        path: '{{ turbo.paths.root }}/plugins/{{ name }}/tsconfig.json',
        templateFile: 'templates/tsconfig.json',
      },
      {
        type: 'add',
        path: '{{ turbo.paths.root }}/plugins/{{ name }}/tsconfig.build.json',
        templateFile: 'templates/tsconfig.build.json',
      },
    ],
  })
}
