import {Box, Stack, Text} from '@sanity/ui'
import {Suspense, useCallback} from 'react'
import {
  MemberField,
  type ObjectInputProps,
  type RenderInputCallback,
  set,
  setIfMissing,
  unset,
} from 'sanity'

import {EditorContainer, FullscreenEditor} from './CodeInputFullscreen'
import {CodeMirrorProxy, useMounted} from './codemirror/useCodeMirror'
import {useLanguageMode} from './codemirror/useLanguageMode'
import {PATH_CODE} from './config'
import {LanguageField} from './LanguageField'
import type {CodeInputValue, CodeSchemaType} from './types'
import {useFieldMember} from './useFieldMember'

export type {CodeInputLanguage, CodeInputValue} from './types'

/**
 * @public
 */
export interface CodeInputProps extends ObjectInputProps<CodeInputValue, CodeSchemaType> {}

/** @public */
export function CodeInput(props: CodeInputProps): React.JSX.Element {
  const {
    members,
    elementProps,
    onChange,
    readOnly,
    renderField,
    renderInput,
    renderItem,
    renderPreview,
    schemaType: type,
    value,
    onPathFocus,
  } = props

  const languageFieldMember = useFieldMember(members, 'language')
  const filenameMember = useFieldMember(members, 'filename')
  const codeFieldMember = useFieldMember(members, 'code')

  const handleCodeFocus = useCallback(() => {
    onPathFocus(PATH_CODE)
  }, [onPathFocus])

  const onHighlightChange = useCallback(
    (lines: number[]) => onChange(set(lines, ['highlightedLines'])),
    [onChange],
  )

  const handleCodeChange = useCallback(
    (code: string) => {
      const path = PATH_CODE
      const fixedLanguage = type.options?.language

      onChange([
        setIfMissing({_type: type.name, language: fixedLanguage}),
        code ? set(code, path) : unset(path),
      ])
    },
    [onChange, type],
  )
  const {languages, language, languageMode} = useLanguageMode(props.schemaType, props.value)

  const mounted = useMounted()

  const fullscreenEnabled = !type.options?.disableFullscreen

  const renderCodeInput: RenderInputCallback = useCallback(
    (inputProps) => (
      <FullscreenEditor enabled={fullscreenEnabled}>
        {({isFullscreen}) => (
          <EditorContainer
            $fullscreen={isFullscreen}
            border={!isFullscreen}
            overflow="hidden"
            radius={1}
            sizing="border"
            readOnly={readOnly}
          >
            {mounted && (
              <Suspense
                fallback={
                  <Box padding={3}>
                    <Text>Loading code editor...</Text>
                  </Box>
                }
              >
                <CodeMirrorProxy
                  languageMode={languageMode}
                  onChange={handleCodeChange}
                  // oxlint-disable-next-line no-unsafe-type-assertion - fix later
                  value={inputProps.value as string}
                  highlightLines={value?.highlightedLines}
                  onHighlightChange={onHighlightChange}
                  readOnly={readOnly}
                  onFocus={handleCodeFocus}
                  onBlur={elementProps.onBlur}
                />
              </Suspense>
            )}
          </EditorContainer>
        )}
      </FullscreenEditor>
    ),
    [
      fullscreenEnabled,
      readOnly,
      mounted,
      languageMode,
      handleCodeChange,
      value?.highlightedLines,
      onHighlightChange,
      handleCodeFocus,
      elementProps.onBlur,
    ],
  )

  return (
    <Stack gap={4}>
      {languageFieldMember && (
        <LanguageField
          member={languageFieldMember}
          language={language}
          languages={languages}
          renderField={renderField}
          renderItem={renderItem}
          renderInput={renderInput}
          renderPreview={renderPreview}
        />
      )}

      {type.options?.withFilename && filenameMember && (
        <MemberField
          member={filenameMember}
          renderItem={renderItem}
          renderField={renderField}
          renderInput={renderInput}
          renderPreview={renderPreview}
        />
      )}

      {codeFieldMember && (
        <MemberField
          member={codeFieldMember}
          renderInput={renderCodeInput}
          renderItem={renderItem}
          renderField={renderField}
          renderPreview={renderPreview}
        />
      )}
    </Stack>
  )
}
