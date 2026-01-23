import {Box, Card, Stack, Text} from '@sanity/ui'
import {getTheme_v2} from '@sanity/ui/theme'
import {Suspense, useCallback} from 'react'
import {
  MemberField,
  type ObjectInputProps,
  type RenderInputCallback,
  set,
  setIfMissing,
  unset,
} from 'sanity'
import {css, styled} from 'styled-components'

import type {CodeInputValue, CodeSchemaType} from './types'

import {CodeMirrorProxy, useMounted} from './codemirror/useCodeMirror'
import {useLanguageMode} from './codemirror/useLanguageMode'
import {PATH_CODE} from './config'
import {LanguageField} from './LanguageField'
import {focusRingBorderStyle, focusRingStyle} from './ui/focusRingStyle'
import {useFieldMember} from './useFieldMember'

export type {CodeInputLanguage, CodeInputValue} from './types'

/**
 * @public
 */
export interface CodeInputProps extends ObjectInputProps<CodeInputValue, CodeSchemaType> {}

const EditorContainer = styled(Card)(({theme}) => {
  const v2 = getTheme_v2({sanity: theme.sanity})
  const {input} = v2
  const border = {
    color: v2.color.input.default.enabled.border,
    width: input.border.width,
  }

  return css`
    --input-box-shadow: ${focusRingBorderStyle(border)};

    box-shadow: var(--input-box-shadow);
    height: 250px;
    min-height: 80px;
    overflow-y: auto;
    position: relative;
    resize: vertical;
    z-index: 0;

    & > .cm-theme {
      height: 100%;
    }

    &:focus-within {
      --input-box-shadow: ${focusRingStyle({
        base: {bg: v2.color.bg},
        border,
        focusRing: v2.card.focusRing,
      })};
    }
  `
})

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

  const renderCodeInput: RenderInputCallback = useCallback(
    (inputProps) => {
      return (
        <EditorContainer border overflow="hidden" radius={1} sizing="border" readOnly={readOnly}>
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
      )
    },
    [
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
    <Stack space={4}>
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
