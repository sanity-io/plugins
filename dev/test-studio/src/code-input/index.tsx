import {codeInput} from '@sanity/code-input'
import {CodeBlockIcon} from '@sanity/icons/CodeBlock'
import {definePlugin, defineType} from 'sanity'

const codeTest = defineType({
  name: 'codeTest',
  type: 'document',
  title: 'Code',
  icon: CodeBlockIcon,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'basicCode',
      title: 'Basic code',
      description: 'A basic code input',
      type: 'code',
    },
    {
      name: 'codeWithOptions',
      title: 'Code with custom language alternatives',
      description: 'A code input with custom language options',
      type: 'code',
      options: {
        languageAlternatives: [
          {title: 'JavaScript', value: 'javascript'},
          {title: 'TypeScript', value: 'typescript'},
          {title: 'Python', value: 'python'},
          {title: 'HTML', value: 'html'},
          {title: 'CSS', value: 'css'},
        ],
      },
    },
    {
      name: 'codeNoFullscreen',
      title: 'Code with fullscreen disabled',
      description: 'A code input with the fullscreen toggle button hidden',
      type: 'code',
      options: {
        disableFullscreen: true,
      },
    },
    {
      name: 'readOnlyCode',
      title: 'Read-only code',
      description: 'Code input in readOnly mode',
      readOnly: true,
      type: 'code',
    },
    {
      name: 'codeList',
      title: 'List of code snippets',
      description: 'An array of code snippets',
      type: 'array',
      of: [
        {
          type: 'code',
        },
      ],
    },
  ],
})

export const codeInputExample = definePlugin(() => ({
  schema: {types: [codeTest]},
  plugins: [codeInput()],
}))
