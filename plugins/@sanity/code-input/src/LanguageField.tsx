import {useCallback} from 'react'
import {type FieldMember, type InputProps, type PrimitiveInputElementProps} from 'sanity'
import {
  MemberField,
  type MemberFieldProps,
} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'

import {LanguageInput} from './LanguageInput'
import type {CodeInputLanguage} from './types'

export function LanguageField(
  props: MemberFieldProps & {member: FieldMember; language: string; languages: CodeInputLanguage[]},
) {
  const {member, languages, language, renderItem, renderField, renderPreview} = props

  const renderInput = useCallback(
    ({elementProps, onChange}: Omit<InputProps, 'renderDefault'>) => {
      return (
        <LanguageInput
          onChange={onChange}
          // oxlint-disable-next-line no-unsafe-type-assertion - fix later
          elementProps={elementProps as PrimitiveInputElementProps}
          language={language}
          languages={languages}
        />
      )
    },
    [languages, language],
  )

  return (
    <MemberField
      member={member}
      renderItem={renderItem}
      renderField={renderField}
      renderInput={renderInput}
      renderPreview={renderPreview}
    />
  )
}
