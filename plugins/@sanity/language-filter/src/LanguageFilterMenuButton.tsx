import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {CircleIcon} from '@sanity/icons/Circle'
import {EyeClosedIcon} from '@sanity/icons/EyeClosed'
import {EyeOpenIcon} from '@sanity/icons/EyeOpen'
import {TranslateIcon} from '@sanity/icons/Translate'
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Popover,
  Stack,
  Text,
  TextInput,
  useClickOutsideEvent,
} from '@sanity/ui'
import {type MouseEventHandler, useCallback, useState} from 'react'
import {TextWithTone} from 'sanity'

import {useLanguageFilterStudioContext} from './LanguageFilterStudioContext'
import {usePaneLanguages} from './usePaneLanguages'

export function LanguageFilterMenuButton(): React.JSX.Element {
  const {options} = useLanguageFilterStudioContext()

  const defaultLanguages = options.supportedLanguages.filter((l) =>
    options.defaultLanguages?.includes(l.id),
  )

  const languageOptions = options.supportedLanguages.filter(
    (l) => !options.defaultLanguages?.includes(l.id),
  )
  const [open, setOpen] = useState(false)
  const {activeLanguages, allSelected, selectAll, selectNone, toggleLanguage} = usePaneLanguages()
  const [button, setButton] = useState<HTMLElement | null>(null)
  const [popover, setPopover] = useState<HTMLElement | null>(null)

  const handleToggleAll: MouseEventHandler<HTMLButtonElement> = useCallback(
    (event) => {
      const checked = event.currentTarget.value === 'ALL'

      if (checked) {
        selectAll()
      } else {
        selectNone()
      }
    },
    [selectAll, selectNone],
  )

  const handleClick = useCallback(() => setOpen((o) => !o), [])

  const handleClickOutside = useCallback(() => setOpen(false), [])

  useClickOutsideEvent(
    handleClickOutside,
    useCallback(
      () => [button, popover].filter((el): el is HTMLElement => el !== null),
      [button, popover],
    ),
  )

  const langCount = options.supportedLanguages.length

  // Search filter query
  const [query, setQuery] = useState('')
  const handleQuery = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.currentTarget.value) {
      setQuery(event.currentTarget.value)
    } else {
      setQuery('')
    }
  }, [])

  const showSearch = langCount > 4

  const content = (
    <Box overflow="auto" style={{maxHeight: 'calc(100vh - 200px)'}}>
      <Stack padding={1} gap={1}>
        {defaultLanguages.length > 0 && (
          <>
            {defaultLanguages.map((l) => (
              <LanguageFilterOption key={l.id} id={l.id} title={l.title} selected />
            ))}
            <Card borderTop />
          </>
        )}

        <Button
          mode="bleed"
          onClick={handleToggleAll}
          justify="flex-start"
          value={allSelected ? 'NONE' : 'ALL'}
          disabled={!!query}
        >
          <Flex gap={3} align="center">
            <Text size={2}>
              {allSelected ? (
                <TextWithTone tone="primary">
                  <EyeClosedIcon />
                </TextWithTone>
              ) : (
                <EyeOpenIcon />
              )}
            </Text>
            <Box flex={1}>
              <Text>{allSelected ? 'Hide all' : 'Show all'}</Text>
            </Box>
          </Flex>
        </Button>

        {showSearch ? (
          <TextInput onChange={handleQuery} value={query} placeholder="Filter languages" />
        ) : (
          <Card borderTop />
        )}

        {languageOptions
          .filter((language) => {
            if (query) {
              return language.title.toLowerCase().includes(query.toLowerCase())
            }
            return true
          })
          .map((lang) => (
            <LanguageFilterOption
              id={lang.id}
              key={lang.id}
              onToggle={toggleLanguage}
              selected={activeLanguages.includes(lang.id)}
              title={lang.title}
            />
          ))}
      </Stack>
    </Box>
  )

  const buttonText =
    activeLanguages.length === langCount
      ? 'Showing all'
      : `Showing ${activeLanguages.length} / ${langCount}`
  return (
    <Popover animate content={content} open={open} portal ref={setPopover}>
      <Button
        text={buttonText}
        icon={TranslateIcon}
        mode="bleed"
        onClick={handleClick}
        ref={setButton}
        selected={open}
      />
    </Popover>
  )
}

function LanguageFilterOption(props: {
  id: string
  selected: boolean
  title: string
  onToggle?: (id: string) => void
}) {
  const {id, onToggle, selected, title} = props

  const handleChange = useCallback(() => {
    if (onToggle) {
      onToggle(id)
    }
  }, [id, onToggle])

  const disabled = !onToggle

  return (
    <Button mode="bleed" onClick={handleChange} justify="flex-start" disabled={disabled}>
      <Flex gap={3} align="center">
        <Text size={2}>
          {selected ? (
            <TextWithTone tone={disabled ? 'default' : 'positive'}>
              <CheckmarkCircleIcon />
            </TextWithTone>
          ) : (
            <CircleIcon />
          )}
        </Text>
        <Box flex={1}>
          <Text>{title}</Text>
        </Box>
        <Badge>{id}</Badge>
      </Flex>
    </Button>
  )
}
