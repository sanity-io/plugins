import {Box, Button, Text, Flex, Stack, Tooltip, useToast} from '@sanity/ui'
import React from 'react'
import {FieldMember, InputProps, set, unset} from 'sanity'
import {MemberField, MemberFieldSet, MemberFieldError, ObjectInputProps} from 'sanity'
import {FieldNameLangPair, TranslationConfig} from './types'
import {getLanguageFromMember} from './helpers/getLanguageFromMember'
import {extractLanguageFromCode} from './helpers/extractLanguageFromCode'
import {htmlDecode} from './helpers/htmlDecode'

export function GoogleTranslateInput(props: ObjectInputProps) {
  const {renderDefault, members, onChange, value} = props
  const {apiKey} = props.schemaType.options

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
      let allLanguageFields = members.reduce<FieldNameLangPair[]>((acc, cur) => {
        if (cur.kind === 'field') {
          const language = getLanguageFromMember(cur)
          if (language && cur.name) {
            return [
              ...acc,
              {
                fieldName: cur.name,
                fieldLang: language,
              },
            ]
          }
        } else if (cur.kind === 'fieldSet') {
          const pairsFromMembers = cur.fieldSet.members.reduce<FieldNameLangPair[]>(
            (memberAcc, memberCur) => {
              if (memberCur.kind === 'field') {
                return [
                  ...memberAcc,
                  {
                    fieldName: memberCur.name,
                    fieldLang: getLanguageFromMember(memberCur),
                  },
                ]
              }

              return memberAcc
            },
            []
          )

          return [...acc, ...pairsFromMembers]
        }
        return acc
      }, [])

      // If this isn't a "translate all" operation, just target the passed-in language
      if (config.language !== config.baseLanguage) {
        allLanguageFields = allLanguageFields.filter((code) => code.fieldName === config.language)
      }

      setIsTranslating(true)

      const url = new URL(`https://translation.googleapis.com/language/translate/v2`)
      url.searchParams.set(`key`, apiKey)
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

      const translations = allLanguageFields.map((item) => {
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
            } else {
              toast.push({
                title: `Translation Complete`,
                status: `success`,
                description: `Translated from "${source.toLocaleUpperCase()}" to "${item.fieldLang.toLocaleUpperCase()}"`,
              })

              const {data} = res

              if (data?.translations?.length) {
                data.translations.forEach(
                  // eslint-disable-next-line max-nested-callbacks
                  ({translatedText}: {translatedText: string}) => {
                    // Convert html entities returned in translation to a string
                    const decoded = htmlDecode(translatedText)

                    // Write translation into the correct language field
                    onChange(decoded ? set(decoded, [item.fieldName]) : unset([item.fieldName]))
                  }
                )
              }
            }
          })
          .catch((err) => {
            console.error(err)
          })
      })

      return Promise.all(translations).then(() => setIsTranslating(false))
    },
    [apiKey, members, onChange, toast]
  )

  const renderInput = React.useCallback(
    (member: InputProps) => {
      if (!value) {
        return renderDefault(member)
      }

      const language = getLanguageFromMember(member)
      const baseMember = members.find((item) => item.kind === 'field') as FieldMember
      const baseLanguage = baseMember ? getLanguageFromMember(baseMember) : ``
      const baseContent = baseMember.field.value ? String(baseMember.field.value) : ``
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
    [handleTranslation, isTranslating, members, renderDefault, value]
  )

  return (
    <Stack space={4}>
      {props.members.map((member) => {
        switch (member.kind) {
          case 'field':
            return (
              <MemberField
                key={member.key}
                member={member}
                // @ts-expect-error
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
                // @ts-expect-error
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
