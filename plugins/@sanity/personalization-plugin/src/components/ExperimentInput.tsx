import {Card, Text} from '@sanity/ui'
import {FormEvent, useCallback, useMemo} from 'react'
import {
  FormPatch,
  getPublishedId,
  PatchEvent,
  set,
  StringInputProps,
  unset,
  useDocumentOperation,
  useFormValue,
} from 'sanity'

import {ExperimentType} from '..'
import {useExperimentContext} from './ExperimentContext'
import {Select} from './Select'

export type SelectOption = {title: string; value: string}
const formatlistOptions = (experiments: ExperimentType[]): SelectOption[] =>
  experiments.map((experiment) => ({
    title: experiment.label,
    value: experiment.id,
  }))

export const ExperimentInput = (
  props: StringInputProps & {variantNameOverride: string; experimentNameOverride: string},
) => {
  const {experiments} = useExperimentContext()

  const id = useFormValue(['_id']) as string
  const additionalChangePath = useMemo(
    () => [...props.path.slice(0, -1), `${props.variantNameOverride}s`],
    [props.variantNameOverride, props.path],
  )
  const subValues = useFormValue(additionalChangePath)

  const {patch} = useDocumentOperation(getPublishedId(id), props.schemaType.name)

  const handleChange = useCallback(
    (
      event: FormEvent<Element>,
      onChange: (patchchange: FormPatch | FormPatch[] | PatchEvent) => void,
    ) => {
      const target = event.currentTarget as HTMLSelectElement
      const inputValue = target.value

      if (inputValue) {
        onChange(set(inputValue))
      } else {
        onChange(unset())
      }

      if (subValues) {
        const patchEvent = {
          unset: [additionalChangePath.join('.')],
        }
        patch.execute([patchEvent])
      }
    },
    [patch, subValues, additionalChangePath],
  )

  if (!experiments.length)
    return (
      <Card padding={[3, 3, 4]} radius={2} shadow={1} tone="caution">
        <Text align="center" size={[2, 2, 3]}>
          There are no defined {props.experimentNameOverride}s
        </Text>
      </Card>
    )

  return (
    <Select {...props} listOptions={formatlistOptions(experiments)} handleChange={handleChange} />
  )
}
