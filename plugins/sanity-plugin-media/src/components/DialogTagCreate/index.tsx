import {Box, Flex} from '@sanity/ui'
import {useSelector} from '@xstate/react'
import {type ReactNode} from 'react'
import {type SubmitHandler, useForm} from 'react-hook-form'

import {useMediaActors} from '../../contexts/MediaActorsContext'
import {tagFormSchema} from '../../formSchema'
import {useServerErrors} from '../../hooks/useServerErrors'
import {selectIsCreatingTag} from '../../machines/tagsMachine'
import type {DialogTagCreateProps, TagFormData} from '../../types'
import sanitizeFormData from '../../utils/sanitizeFormData'
import zodFormResolver from '../../utils/zodFormResolver'
import Dialog from '../Dialog'
import FormFieldInputText from '../FormFieldInputText'
import FormSubmitButton from '../FormSubmitButton'

type Props = {
  children: ReactNode
  dialog: DialogTagCreateProps
}

const DialogTagCreate = (props: Props) => {
  const {
    children,
    dialog: {id},
  } = props

  const {dialogs, tags} = useMediaActors()
  const creating = useSelector(tags, selectIsCreatingTag)
  const creatingError = useSelector(tags, (snapshot) => snapshot.context.creatingError)
  const serverErrors = useServerErrors<TagFormData>('name', creatingError)

  const {
    // Read the formState before render to subscribe the form state through Proxy
    formState: {errors, isDirty, isValid},
    handleSubmit,
    register,
  } = useForm<TagFormData>({
    defaultValues: {
      name: '',
    },
    errors: serverErrors,
    mode: 'onChange',
    resolver: zodFormResolver<TagFormData>(tagFormSchema),
  })

  const handleClose = () => {
    dialogs.send({type: 'dialogs.clear'})
  }

  // - submit react-hook-form
  const onSubmit: SubmitHandler<TagFormData> = (formData) => {
    const sanitizedFormData = sanitizeFormData(formData)

    tags.send({type: 'tag.create', closeDialogId: id, name: sanitizedFormData['name']})
  }

  const Footer = () => (
    <Box padding={3}>
      <Flex justify="flex-end">
        {/* Submit button */}
        <FormSubmitButton
          disabled={creating || !isDirty || !isValid}
          isValid={isValid}
          onClick={handleSubmit(onSubmit)}
        />
      </Flex>
    </Box>
  )

  return (
    <Dialog
      animate
      // oxlint-disable-next-line react/static-components
      footer={<Footer />}
      header="Create Tag"
      id={id}
      onClose={handleClose}
      width={1}
    >
      {/* Form fields */}
      <Box as="form" padding={4} onSubmit={handleSubmit(onSubmit)}>
        {/* Hidden button to enable enter key submissions */}
        <button style={{display: 'none'}} tabIndex={-1} type="submit" />

        {/* Title */}
        <FormFieldInputText
          {...register('name')}
          disabled={creating}
          error={errors?.name?.message}
          label="Name"
          name="name"
        />
      </Box>

      {children}
    </Dialog>
  )
}

export default DialogTagCreate
