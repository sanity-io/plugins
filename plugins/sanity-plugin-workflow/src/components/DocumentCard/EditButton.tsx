import {EditIcon} from '@sanity/icons/Edit'
import {Button} from '@sanity/ui'
import {getPublishedId} from 'sanity'
import {useRouter} from 'sanity/router'

type EditButtonProps = {
  id: string
  type: string
  disabled?: boolean
}

export default function EditButton(props: EditButtonProps) {
  const {id, type, disabled = false} = props
  const {navigateIntent} = useRouter()

  return (
    <Button
      // editOpsOf throws when id is a draft or version id.
      onClick={() => navigateIntent('edit', {id: getPublishedId(id), type})}
      mode="ghost"
      fontSize={1}
      padding={2}
      tabIndex={-1}
      icon={EditIcon}
      text="Edit"
      disabled={disabled}
    />
  )
}
