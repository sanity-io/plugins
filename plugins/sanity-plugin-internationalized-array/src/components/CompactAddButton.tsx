import {AddIcon} from '@sanity/icons/Add'
import {TranslateIcon} from '@sanity/icons/Translate'
import {Button, Flex} from '@sanity/ui'
import {Menu, MenuButton, MenuDivider, MenuItem} from '@sanity/ui/menu'
import {useId} from 'react'

import {getLanguageDisplay} from '../utils/getLanguageDisplay'
import {useInternationalizedArrayContext} from './InternationalizedArrayContext'

type CompactAddButtonProps = {
  readOnly: boolean
  handleClick: (languageId: string) => void
  languagesInUse: string[]
  onAddAll: () => void
  buttonAddAll: boolean
  addAllTitle: string
  allLanguagesArePresent: boolean
}

/**
 * One translate-icon button that opens a language menu — the `fieldMenu`
 * location. Compact, uses only stable `@sanity/ui`, and stays visible even
 * when every language is already present.
 */
function CompactAddButton(props: CompactAddButtonProps) {
  const {
    readOnly,
    languagesInUse,
    handleClick,
    onAddAll,
    buttonAddAll,
    addAllTitle,
    allLanguagesArePresent,
  } = props
  const {languageDisplay, filteredLanguages: languages} = useInternationalizedArrayContext()
  const menuId = useId()

  if (!languages.length) return null

  return (
    <Flex justify="flex-end" data-testid="field-menu">
      <MenuButton
        id={menuId}
        popover={{portal: true, placement: 'bottom-end'}}
        button={
          <Button
            mode="bleed"
            tone="default"
            fontSize={1}
            padding={2}
            icon={TranslateIcon}
            aria-label="Add translation"
            title="Add translation"
            data-testid="add-translation-menu"
            disabled={readOnly}
          />
        }
        menu={
          <Menu>
            {languages.map((language) => (
              <MenuItem
                key={language.id}
                text={getLanguageDisplay(languageDisplay, language.title, language.id)}
                icon={AddIcon}
                disabled={readOnly || languagesInUse.includes(language.id)}
                data-testid={`field-menu-add-${language.id}`}
                onClick={() => handleClick(language.id)}
              />
            ))}
            {buttonAddAll ? (
              <>
                <MenuDivider />
                <MenuItem
                  text={addAllTitle}
                  icon={TranslateIcon}
                  disabled={readOnly || allLanguagesArePresent}
                  data-testid="field-menu-add-all"
                  onClick={onAddAll}
                />
              </>
            ) : null}
          </Menu>
        }
      />
    </Flex>
  )
}

export default CompactAddButton
