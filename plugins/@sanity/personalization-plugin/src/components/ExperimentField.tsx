import {CloseIcon} from '@sanity/icons'
import {useCallback, useMemo} from 'react'
import {GiSoapExperiment} from 'react-icons/gi'
import {
  defineDocumentFieldAction,
  DocumentFieldActionItem,
  DocumentFieldActionProps,
  FormPatch,
  ObjectFieldProps,
  PatchEvent,
  set,
  unset,
} from 'sanity'
type PatchStuff = {onChange: (patch: FormPatch | FormPatch[] | PatchEvent) => void; inputId: string}

const useAddExperimentAction = (
  props: DocumentFieldActionProps &
    PatchStuff & {experimentNameOverride: string; experimentId: string; active: boolean},
): DocumentFieldActionItem => {
  const {onChange, active, experimentNameOverride} = props

  const handleAddAction = useCallback(() => {
    onChange([set(!active, ['active'])])
  }, [onChange, active])

  return {
    title: `Add ${experimentNameOverride}`,
    type: 'action',
    icon: GiSoapExperiment,
    onAction: handleAddAction,
    renderAsButton: true,
  }
}

const useRemoveExperimentAction = (
  props: DocumentFieldActionProps &
    PatchStuff & {
      experimentNameOverride: string
      experimentId: string
      active: boolean
      variantNameOverride: string
    },
): DocumentFieldActionItem => {
  const {onChange, active, experimentId, experimentNameOverride, variantNameOverride} = props
  const handleClearAction = useCallback(() => {
    const activeId = ['active']
    const experiment = [experimentId]
    const variants = [`${variantNameOverride}s`]
    onChange([set(!active, activeId), unset(experiment), unset(variants)])
  }, [onChange, active, experimentId, variantNameOverride])

  return {
    title: `Remove ${experimentNameOverride}`,
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
  experimentNameOverride,
  experimentId,
  variantNameOverride,
}: PatchStuff & {
  active?: boolean
  experimentNameOverride: string
  experimentId: string
  variantNameOverride: string
}) => {
  const removeAction = defineDocumentFieldAction({
    name: `Remove ${experimentNameOverride}`,
    useAction: (props) =>
      useRemoveExperimentAction({
        ...props,
        active: true,
        onChange,
        inputId,
        experimentNameOverride,
        experimentId,
        variantNameOverride,
      }),
  })
  const addAction = defineDocumentFieldAction({
    name: `Add ${experimentNameOverride}`,
    useAction: (props) =>
      useAddExperimentAction({
        ...props,
        active: false,
        onChange,
        inputId,
        experimentNameOverride,
        experimentId,
      }),
  })
  return active ? removeAction : addAction
}

export const ExperimentField = (
  props: ObjectFieldProps & {
    experimentNameOverride: string
    experimentId: string
    variantNameOverride: string
  },
) => {
  const {onChange} = props.inputProps
  const {inputId, experimentNameOverride, experimentId, variantNameOverride} = props
  const active = props.value?.active as boolean | undefined

  const actionProps = useMemo(
    () => ({
      onChange,
      inputId,
      active,
      experimentNameOverride,
      experimentId,
      variantNameOverride,
    }),
    [onChange, inputId, active, experimentNameOverride, experimentId, variantNameOverride],
  )

  const memoizedActions = useMemo(() => {
    const oldActions = props.actions || []
    return [createActions(actionProps), ...oldActions]
  }, [actionProps, props.actions])

  const withActionProps = useMemo(
    () => ({
      ...props,
      actions: memoizedActions,
    }),
    [props, memoizedActions],
  )
  return props.renderDefault(withActionProps)
}
