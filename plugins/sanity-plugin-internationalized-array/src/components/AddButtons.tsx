import {AddIcon} from '@sanity/icons'
import {Button, Grid} from '@sanity/ui'

import type {Language, InternationalizedArrayItem} from '../types'

import {LANGUAGE_FIELD_NAME, MAX_COLUMNS} from '../constants'
import {getLanguageDisplay} from '../utils/getLanguageDisplay'
import {useInternationalizedArrayContext} from './InternationalizedArrayContext'

type AddButtonsProps = {
  languages: Language[]
  readOnly: boolean
  value: InternationalizedArrayItem[] | undefined
  handleClick: (languageId: string) => void
}

/**
 * Renders a grid of "add language" buttons — one per configured language.
 *
 * Returns `null` when the `languages` array is empty.
 *
 * Each button is disabled when:
 * - `readOnly` is `true`, or
 * - the language already exists in the current `value` array
 *   (matched via `LANGUAGE_FIELD_NAME`).
 *
 * The button label is formatted according to the `languageDisplay` setting
 * from the plugin context (e.g. code-only, title-only, or both).
 * An `AddIcon` is shown unless there are more languages than fit in one row
 * and the display mode is `'codeOnly'`.
 */
function AddButtons(props: AddButtonsProps) {
  const {languages, readOnly, value, handleClick} = props
  const {languageDisplay} = useInternationalizedArrayContext()

  return languages.length > 0 ? (
    <Grid
      columns={Math.min(languages.length, MAX_COLUMNS[languageDisplay])}
      gap={2}
      data-testid="add-buttons-grid"
    >
      {languages.map((language) => {
        const languageTitle: string = getLanguageDisplay(
          languageDisplay,
          language.title,
          language.id,
        )
        return (
          <Button
            key={language.id}
            tone="primary"
            mode="ghost"
            fontSize={1}
            data-testid={`add-${language.id}`}
            disabled={
              readOnly || Boolean(value?.find((item) => item[LANGUAGE_FIELD_NAME] === language.id))
            }
            text={languageTitle}
            // Only show plus icon if there's one row or less AND only showing codes
            icon={
              languages.length > MAX_COLUMNS[languageDisplay] && languageDisplay === 'codeOnly'
                ? undefined
                : AddIcon
            }
            value={language.id}
            onClick={() => handleClick(language.id)}
          />
        )
      })}
    </Grid>
  ) : null
}

export default AddButtons
