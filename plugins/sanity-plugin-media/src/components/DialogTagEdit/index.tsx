import {Box, Button, Card, Flex, Text} from '@sanity/ui'
import {useSelector} from '@xstate/react'
import {type ReactNode, useMemo, useState} from 'react'
import {type SubmitHandler, useForm} from 'react-hook-form'

import {useMediaActors} from '../../contexts/MediaActorsContext'
import {tagFormSchema} from '../../formSchema'
import {useServerErrors} from '../../hooks/useServerErrors'
import {confirmDeleteTagDialog} from '../../machines/dialogs'
import type {DialogTagEditProps, TagFormData} from '../../types'
import sanitizeFormData from '../../utils/sanitizeFormData'
import zodFormResolver from '../../utils/zodFormResolver'
import Dialog from '../Dialog'
import FormFieldInputText from '../FormFieldInputText'
import FormSubmitButton from '../FormSubmitButton'

type Props = {
  children: ReactNode
  dialog: DialogTagEditProps
}

const DialogTagEdit = (props: Props) => {
  const {
    children,
    dialog: {id, tagId},
  } = props

  const {dialogs, tags} = useMediaActors()
  const tagItem = useSelector(tags, (snapshot) =>
    tagId ? snapshot.context.byIds[tagId] : undefined,
  )

  // Keep showing the last known version of the tag if it is deleted elsewhere
  const [lastKnownTag, setLastKnownTag] = useState(tagItem?.tag)
  if (tagItem && tagItem.tag !== lastKnownTag) {
    setLastKnownTag(tagItem.tag)
  }
  const currentTag = tagItem?.tag ?? lastKnownTag

  const tagName = currentTag?.name?.current || ''
  const values = useMemo(() => ({name: tagName}), [tagName])
  const serverErrors = useServerErrors<TagFormData>('name', tagItem?.error)

  const {
    // Read the formState before render to subscribe the form state through Proxy
    formState: {errors, isDirty, isValid},
    handleSubmit,
    register,
  } = useForm<TagFormData>({
    errors: serverErrors,
    mode: 'onChange',
    resolver: zodFormResolver<TagFormData>(tagFormSchema),
    // Follows remote changes to the tag
    values,
  })

  const formUpdating = !tagItem || tagItem.updating

  const handleClose = () => {
    dialogs.send({type: 'dialog.close', id})
  }

  // Submit react-hook-form
  const onSubmit: SubmitHandler<TagFormData> = (formData) => {
    if (!tagItem) {
      return
    }
    const sanitizedFormData = sanitizeFormData(formData)
    tags.send({
      type: 'tag.update',
      closeDialogId: id,
      name: sanitizedFormData['name'],
      tag: tagItem.tag,
    })
  }

  const handleDelete = () => {
    if (!tagItem) {
      return
    }
    dialogs.send({type: 'dialog.open', dialog: confirmDeleteTagDialog(tagItem.tag, id)})
  }

  const Footer = () => (
    <Box padding={3}>
      <Flex justify="space-between">
        {/* Delete button */}
        <Button
          disabled={formUpdating}
          fontSize={1}
          mode="bleed"
          onClick={handleDelete}
          text="Delete"
          tone="critical"
        />

        {/* Submit button */}
        <FormSubmitButton
          disabled={formUpdating || !isDirty || !isValid}
          isValid={isValid}
          lastUpdated={tagItem?.tag?._updatedAt}
          onClick={handleSubmit(onSubmit)}
        />
      </Flex>
    </Box>
  )

  if (!currentTag) {
    return null
  }

  return (
    <Dialog
      animate
      // oxlint-disable-next-line react/static-components
      footer={<Footer />}
      header="Edit Tag"
      id={id}
      onClose={handleClose}
      width={1}
    >
      {/* Form fields */}
      <Box as="form" padding={4} onSubmit={handleSubmit(onSubmit)}>
        {/* Deleted notification */}
        {!tagItem && (
          <Card marginBottom={3} padding={3} radius={2} shadow={1} tone="critical">
            <Text size={1}>This tag cannot be found – it may have been deleted.</Text>
          </Card>
        )}

        {/* Hidden button to enable enter key submissions */}
        <button style={{display: 'none'}} tabIndex={-1} type="submit" />

        {/* Title */}
        <FormFieldInputText
          {...register('name')}
          disabled={formUpdating}
          error={errors?.name?.message}
          label="Name"
          name="name"
        />
      </Box>

      {children}
    </Dialog>
  )
}

export default DialogTagEdit
