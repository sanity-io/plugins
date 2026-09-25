import {Box, Button, Inline, Text} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'
import {format} from 'date-fns/format'
import {type ReactNode} from 'react'

type Props = {
  disabled: boolean
  isValid: boolean
  lastUpdated?: string
  onClick: () => void
  /**
   * Save without dismissing the dialog.
   *
   * When provided, a secondary 'Save' button is rendered alongside 'Save and
   * close'. Dialogs that have nothing left to do once saved (creating a folder
   * or a tag) omit it and keep the single button.
   */
  onSave?: () => void
}

const FormSubmitButton = (props: Props) => {
  const {disabled, isValid, lastUpdated, onClick, onSave} = props

  let content: ReactNode
  if (isValid) {
    if (lastUpdated) {
      content = (
        <>
          Last updated
          <br /> {format(new Date(lastUpdated), 'PPp')}
        </>
      )
    } else {
      content = 'No unpublished changes'
    }
  } else {
    content =
      'There are validation errors that need to be fixed before this document can be published'
  }

  return (
    <Tooltip
      animate
      content={
        <Box padding={3} style={{maxWidth: '185px'}}>
          <Text muted size={1}>
            {content}
          </Text>
        </Box>
      }
      disabled={'ontouchstart' in window}
      placement="top"
      portal
    >
      <Box>
        <Inline gap={2}>
          {onSave && (
            <Button
              disabled={disabled}
              fontSize={1}
              mode="ghost"
              onClick={onSave}
              text="Save"
              tone="primary"
            />
          )}
          <Button
            disabled={disabled}
            fontSize={1}
            onClick={onClick}
            text="Save and close"
            tone="primary"
          />
        </Inline>
      </Box>
    </Tooltip>
  )
}

export default FormSubmitButton
