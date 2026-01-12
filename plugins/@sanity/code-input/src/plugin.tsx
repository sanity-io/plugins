import type {InputProps} from 'sanity'

import {memoize} from 'lodash-es'
import {definePlugin, type Plugin} from 'sanity'

import type {CodeMode} from './codemirror/defaultCodeModes'

import {
  CodeInputConfigContext,
  CodeInputLanguageModeLoaderContext,
} from './codemirror/CodeModeContext'
import {codeSchema} from './schema'

export interface CodeInputConfig {
  codeModes?: CodeMode[]
}

/**
 * @public
 */
export const codeInput: Plugin<CodeInputConfig | void> = definePlugin<CodeInputConfig | void>(
  (config) => {
    const codeModes = config?.codeModes

    const basePlugin = {
      name: '@sanity/code-input',
      schema: {types: [codeSchema]},
    }
    if (!codeModes) {
      return basePlugin
    }

    const languageModeLoader = memoize(
      async ({mode, defaultCodeModes}: {mode: string; defaultCodeModes: CodeMode[]}) => {
        const modes = [...codeModes, ...defaultCodeModes]

        const codeMode = modes.find((m) => m.name === mode)
        if (!codeMode?.loader) {
          console.warn(
            `Found no codeMode for language mode ${mode}, syntax highlighting will be disabled.`,
          )
          return undefined
        }
        return codeMode.loader()
      },
    )
    return {
      ...basePlugin,
      form: {
        components: {
          input: (props) => (
            <InputComponent {...props} config={config} languageModeLoader={languageModeLoader} />
          ),
        },
      },
    }
  },
)

function InputComponent(props: InputProps & {config: CodeInputConfig; languageModeLoader: any}) {
  if (props.id !== 'root') {
    return props.renderDefault(props)
  }
  return (
    <CodeInputConfigContext.Provider value={props.config}>
      <CodeInputLanguageModeLoaderContext.Provider value={props.languageModeLoader}>
        {props.renderDefault(props)}
      </CodeInputLanguageModeLoaderContext.Provider>
    </CodeInputConfigContext.Provider>
  )
}
