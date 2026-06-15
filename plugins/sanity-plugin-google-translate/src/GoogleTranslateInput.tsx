import {Box, Button, Text, Flex, Stack, Tooltip, useToast} from '@sanity/ui'
import React from 'react'
import {MemberField, MemberFieldSet, MemberFieldError, set, unset} from 'sanity'
import type {FieldMember, InputProps, ObjectInputProps} from 'sanity'

import {extractLanguageFromCode} from './helpers/extractLanguageFromCode'
import {getLanguageFromMember} from './helpers/getLanguageFromMember'
import {htmlDecode} from './helpers/htmlDecode'
import type {FieldNameLangPair, GoogleTranslateSchemaOptions, TranslationConfig} from './types'

function collectLanguageFields(members: ObjectInputProps['members']): FieldNameLangPair[] {
  const allLanguageFields: FieldNameLangPair[] = []

  for (const cur of members) {
    if (cur.kind === 'field') {
      const language = getLanguageFromMember(cur)
      if (language && cur.name) {
        allLanguageFields.push({
          fieldName: cur.name,
          fieldLang: language,
        })
      }
    } else if (cur.kind === 'fieldSet') {
      for (const memberCur of cur.fieldSet.members) {
        if (memberCur.kind === 'field') {
          allLanguageFields.push({
            fieldName: memberCur.name,
            fieldLang: getLanguageFromMember(memberCur),
          })
        }
      }
    }
  }

  return allLanguageFields
}

export function GoogleTranslateInput(props: ObjectInputProps) {
  const {renderDefault, members, onChange, value} = props
  // oxlint-disable-next-line no-unsafe-type-assertion - plugin-specific object options
  const {apiKey} = (props.schemaType.options ?? {}) as GoogleTranslateSchemaOptions

  const [isTranslating, setIsTranslating] = React.useState(false)
  const toast = useToast()

  const handleTranslation = React.useCallback(
    (config: TranslationConfig) => {
      if (!config?.content) {
        return toast.push({
          title: `No content to translate`,
          status: `warning`,
        })
      }

      // Get all unique language field names and codes
      // Maybe this should be recursive, but the recommendation is only to nest 1 level deep
      // TODO: Remove hidden/filtered-out fields as this currently will write to all fields
      let allLanguageFields = collectLanguageFields(members)

      // If this isn't a "translate all" operation, just target the passed-in language
      if (config.language !== config.baseLanguage) {
        allLanguageFields = allLanguageFields.filter((code) => code.fieldName === config.language)
      }

      setIsTranslating(true)

      const url = new URL(`https://translation.googleapis.com/language/translate/v2`)
      url.searchParams.set(`key`, apiKey ?? ``)
      url.searchParams.set(`q`, config.content)

      // Language code might be a country/language pair like en_US
      const target = extractLanguageFromCode(config.language)
      const source = extractLanguageFromCode(config.baseLanguage)
      url.searchParams.set(`source`, source)

      if (allLanguageFields.length === 1 && target === source) {
        return toast.push({
          title: `Bad language pair`,
          status: `warning`,
          description: `Cannot translate from "${source.toLocaleUpperCase()}" to "${target.toLocaleUpperCase()}"`,
        })
      }

      const translations = allLanguageFields.map(async (item) => {
        url.searchParams.set(`target`, item.fieldLang)

        if (item.fieldLang === source) {
          return null
        }

        return fetch(url.toString())
          .then((res) => res.json())
          .then((res) => {
            if (res.error) {
              toast.push({
                title: `Error`,
                status: `error`,
                description: res.error.message,
              })
              return undefined
            }

            toast.push({
              title: `Translation Complete`,
              status: `success`,
              description: `Translated from "${source.toLocaleUpperCase()}" to "${item.fieldLang.toLocaleUpperCase()}"`,
            })

            const {data} = res

            if (data?.translations?.length) {
              data.translations.forEach(({translatedText}: {translatedText: string}) => {
                // Convert html entities returned in translation to a string
                const decoded = htmlDecode(translatedText)

                // Write translation into the correct language field
                onChange(decoded ? set(decoded, [item.fieldName]) : unset([item.fieldName]))
              })
            }

            return undefined
          })
          .catch((err) => {
            console.error(err)
          })
      })

      return Promise.all(translations).then(() => setIsTranslating(false))
    },
    [apiKey, members, onChange, toast],
  )

  const renderInput = React.useCallback(
    (member: InputProps) => {
      if (!value) {
        return renderDefault(member)
      }

      const language = getLanguageFromMember(member)
      const baseMember = members.find((item): item is FieldMember => item.kind === 'field')
      const baseLanguage = baseMember ? getLanguageFromMember(baseMember) : ``
      const baseFieldValue = baseMember?.field.value
      const baseContent = typeof baseFieldValue === 'string' ? baseFieldValue : ``
      const isBaseLanguage = language === baseLanguage

      if (!language) {
        return renderDefault(member)
      }

      return (
        <Flex gap={1}>
          <Box flex={1}>{renderDefault(member)}</Box>
          <Tooltip
            content={
              <Box padding={2}>
                {isBaseLanguage ? (
                  <Text size={1}>
                    Translate all fields from the "{baseLanguage.toLocaleUpperCase()}" content
                  </Text>
                ) : (
                  <Text size={1}>
                    Translate the "{baseLanguage.toLocaleUpperCase()}" field content to "
                    {language.toLocaleUpperCase()}"
                  </Text>
                )}
              </Box>
            }
            fallbackPlacements={['right', 'left']}
            placement="top"
            portal
          >
            <Button
              mode="ghost"
              disabled={isTranslating || (isBaseLanguage && !member?.value)}
              value={language}
              text={isBaseLanguage ? `Translate All` : `Translate ${language.toUpperCase()}`}
              onClick={() =>
                handleTranslation({
                  language,
                  baseLanguage,
                  content: baseContent,
                })
              }
            />
          </Tooltip>
        </Flex>
      )
    },
    [handleTranslation, isTranslating, members, renderDefault, value],
  )

  return (
    <Stack gap={4}>
      {props.members.map((member) => {
        switch (member.kind) {
          case 'field':
            return (
              <MemberField
                key={member.key}
                member={member}
                // @ts-expect-error - MemberField renderInput typings do not match custom callback
                renderInput={renderInput}
                renderPreview={props.renderPreview}
                renderField={props.renderField}
                renderItem={props.renderItem}
              />
            )
          case 'fieldSet':
            return (
              <MemberFieldSet
                key={member.key}
                member={member}
                // @ts-expect-error - MemberFieldSet renderInput typings do not match custom callback
                renderInput={renderInput}
                renderPreview={props.renderPreview}
                renderField={props.renderField}
                renderItem={props.renderItem}
              />
            )
          case 'error':
            return <MemberFieldError key={member.key} member={member} />
          default:
            return null
        }
      })}
    </Stack>
  )
}
