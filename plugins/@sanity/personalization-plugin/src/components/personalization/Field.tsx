import {CloseIcon} from '@sanity/icons'
import {useCallback, useMemo} from 'react'
import {IoMdPeople} from 'react-icons/io'
import {
  defineDocumentFieldAction,
  type DocumentFieldActionItem,
  type DocumentFieldActionProps,
  type FormPatch,
  type ObjectFieldProps,
  type PatchEvent,
  set,
  unset,
} from 'sanity'

import {clearChildrenGroups} from '../../utils/clearChildGroups'

type PatchStuff = {onChange: (patch: FormPatch | FormPatch[] | PatchEvent) => void; inputId: string}

const useAddPersonalizationAction = (
  props: DocumentFieldActionProps &
    PatchStuff & {personalizationNameOverride: string; active: boolean},
): DocumentFieldActionItem => {
  const {onChange, active, personalizationNameOverride} = props

  const handleAddAction = useCallback(() => {
    onChange([set(!active, ['active'])])
  }, [onChange, active])

  return {
    title: `Add ${personalizationNameOverride}`,
    type: 'action',
    icon: IoMdPeople,
    onAction: handleAddAction,
    renderAsButton: true,
  }
}

const useRemovePersonalizationAction = (
  props: DocumentFieldActionProps &
    PatchStuff & {
      personalizationNameOverride: string
      active: boolean
      segmentNameOverride: string
    },
): DocumentFieldActionItem => {
  const {onChange, active, personalizationNameOverride, segmentNameOverride} = props
  const handleClearAction = useCallback(() => {
    const activeId = ['active']
    const segments = [`${segmentNameOverride}s`]
    onChange([set(!active, activeId), unset(segments)])
  }, [onChange, active, segmentNameOverride])

  return {
    title: `Remove ${personalizationNameOverride}`,
    type: 'action',
    icon: CloseIcon,
    onAction: handleClearAction,
    renderAsButton: true,
  }
}

const createActions = ({
  onChange,
  inputId,
  active,
  personalizationNameOverride,
  segmentNameOverride,
}: PatchStuff & {
  active?: boolean
  personalizationNameOverride: string
  segmentNameOverride: string
}) => {
  const removeAction = defineDocumentFieldAction({
    name: `Remove ${personalizationNameOverride}`,
    useAction: (props) =>
      useRemovePersonalizationAction({
        ...props,
        active: true,
        onChange,
        inputId,
        personalizationNameOverride,
        segmentNameOverride,
      }),
  })
  const addAction = defineDocumentFieldAction({
    name: `Add ${personalizationNameOverride}`,
    useAction: (props) =>
      useAddPersonalizationAction({
        ...props,
        active: false,
        onChange,
        inputId,
        personalizationNameOverride,
      }),
  })
  return active ? removeAction : addAction
}

export const Field = (
  props: ObjectFieldProps & {
    personalizationNameOverride: string
    segmentNameOverride: string
  },
) => {
  const {onChange} = props.inputProps
  const {inputId, personalizationNameOverride, segmentNameOverride} = props
  const active = props.value?.['active'] as boolean | undefined

  const actionProps = useMemo(
    () => ({
      onChange,
      inputId,
      active,
      personalizationNameOverride,
      segmentNameOverride,
    }),
    [onChange, inputId, active, personalizationNameOverride, segmentNameOverride],
  )

  const memoizedActions = useMemo(() => {
    const oldActions = props.actions || []
    return [createActions(actionProps), ...oldActions]
  }, [actionProps, props.actions])

  const enhancedProps = useMemo(() => {
    const propsWithClearedGroups = clearChildrenGroups(props)
    return {
      ...propsWithClearedGroups,
      actions: memoizedActions,
    }
  }, [props, memoizedActions])

  return props.renderDefault(enhancedProps)
}
