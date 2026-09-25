import {Box, Flex, Text} from '@sanity/ui'
import {useSelector} from '@xstate/react'
import {type ReactNode} from 'react'
import {type SubmitHandler, useForm} from 'react-hook-form'

import {useMediaActors} from '../../contexts/MediaActorsContext'
import {folderFormSchema} from '../../formSchema'
import {useServerErrors} from '../../hooks/useServerErrors'
import {selectFolderPath, selectIsCreatingFolder} from '../../machines/foldersMachine'
import type {DialogFolderCreateProps, FolderFormData} from '../../types'
import sanitizeFormData from '../../utils/sanitizeFormData'
import zodFormResolver from '../../utils/zodFormResolver'
import Dialog from '../Dialog'
import FormFieldInputText from '../FormFieldInputText'
import FormSubmitButton from '../FormSubmitButton'

type Props = {
  children: ReactNode
  dialog: DialogFolderCreateProps
}

const DialogFolderCreate = (props: Props) => {
  const {
    children,
    dialog: {parentFolderId, id},
  } = props

  const {dialogs, folders} = useMediaActors()
  const creating = useSelector(folders, selectIsCreatingFolder)
  const creatingError = useSelector(folders, (snapshot) => snapshot.context.creatingError)
  const parentPath = useSelector(folders, (snapshot) =>
    selectFolderPath(snapshot, parentFolderId ?? null),
  )
  const serverErrors = useServerErrors<FolderFormData>('name', creatingError)

  const {
    formState: {errors, isDirty, isValid},
    handleSubmit,
    register,
  } = useForm<FolderFormData>({
    defaultValues: {
      name: '',
    },
    errors: serverErrors,
    mode: 'onChange',
    resolver: zodFormResolver<FolderFormData>(folderFormSchema),
  })

  const handleClose = () => {
    dialogs.send({type: 'dialogs.clear'})
  }

  const onSubmit: SubmitHandler<FolderFormData> = (formData) => {
    const sanitizedFormData = sanitizeFormData(formData)
    folders.send({
      type: 'folder.create',
      name: sanitizedFormData['name'],
      parentId: parentFolderId || null,
    })
  }

  const footer = (
    <Box padding={3}>
      <Flex justify="flex-end">
        <FormSubmitButton
          disabled={creating || !isDirty || !isValid}
          isValid={isValid}
          onClick={handleSubmit(onSubmit)}
        />
      </Flex>
    </Box>
  )

  return (
    <Dialog animate footer={footer} header="Create Folder" id={id} onClose={handleClose} width={1}>
      <Box as="form" padding={4} onSubmit={handleSubmit(onSubmit)}>
        <button style={{display: 'none'}} tabIndex={-1} type="submit" />

        {parentPath && (
          <Box marginBottom={3}>
            <Text muted size={1}>
              Creating inside {parentPath}
            </Text>
          </Box>
        )}

        <FormFieldInputText
          {...register('name')}
          disabled={creating}
          error={errors?.name?.message}
          label="Folder name"
          name="name"
        />
      </Box>

      {children}
    </Dialog>
  )
}

export default DialogFolderCreate
