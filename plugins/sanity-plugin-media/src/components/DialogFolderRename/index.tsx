import {Box, Flex, Text} from '@sanity/ui'
import {useSelector} from '@xstate/react'
import {type ReactNode} from 'react'
import {type SubmitHandler, useForm} from 'react-hook-form'

import {useMediaActors} from '../../contexts/MediaActorsContext'
import {folderFormSchema} from '../../formSchema'
import {useServerErrors} from '../../hooks/useServerErrors'
import {selectIsRenamingFolder} from '../../machines/foldersMachine'
import type {DialogFolderRenameProps, FolderFormData} from '../../types'
import sanitizeFormData from '../../utils/sanitizeFormData'
import zodFormResolver from '../../utils/zodFormResolver'
import Dialog from '../Dialog'
import FormFieldInputText from '../FormFieldInputText'
import FormSubmitButton from '../FormSubmitButton'

type Props = {
  children: ReactNode
  dialog: DialogFolderRenameProps
}

const DialogFolderRename = ({children, dialog}: Props) => {
  const {folderId, id} = dialog
  const {dialogs, folders} = useMediaActors()
  const renaming = useSelector(folders, selectIsRenamingFolder)
  const renameError = useSelector(folders, (snapshot) => snapshot.context.renameError)
  const folder = useSelector(folders, (snapshot) => snapshot.context.byId[folderId])
  const serverErrors = useServerErrors<FolderFormData>('name', renameError)

  const folderPath = folder?.path ?? ''
  const parentPath = folderPath.includes('/')
    ? folderPath.slice(0, folderPath.lastIndexOf('/'))
    : null

  const {
    formState: {errors, isDirty, isValid},
    handleSubmit,
    register,
  } = useForm<FolderFormData>({
    defaultValues: {
      name: folder?.name || '',
    },
    errors: serverErrors,
    mode: 'onChange',
    resolver: zodFormResolver<FolderFormData>(folderFormSchema),
  })

  const handleClose = () => {
    dialogs.send({type: 'dialog.close', id})
  }

  const onSubmit: SubmitHandler<FolderFormData> = (formData) => {
    const sanitizedFormData = sanitizeFormData(formData)
    folders.send({type: 'folder.rename', folderId, name: sanitizedFormData['name']})
  }

  return (
    <Dialog
      animate
      footer={
        <Box padding={3}>
          <Flex justify="flex-end">
            <FormSubmitButton
              disabled={renaming || !isDirty || !isValid}
              isValid={isValid}
              onClick={handleSubmit(onSubmit)}
            />
          </Flex>
        </Box>
      }
      header="Rename Folder"
      id={id}
      onClose={handleClose}
      width={1}
    >
      <Box as="form" padding={4} onSubmit={handleSubmit(onSubmit)}>
        <button style={{display: 'none'}} tabIndex={-1} type="submit" />

        <Box marginBottom={3}>
          <Text muted size={1}>
            {parentPath ? `Renaming inside ${parentPath}` : 'Renaming at root'}
          </Text>
        </Box>

        <FormFieldInputText
          {...register('name')}
          disabled={renaming}
          error={errors?.name?.message}
          label="Folder name"
          name="name"
        />
      </Box>

      {children}
    </Dialog>
  )
}

export default DialogFolderRename
