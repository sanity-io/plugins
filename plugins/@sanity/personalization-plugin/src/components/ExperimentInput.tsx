import {Card, Text} from '@sanity/ui'
import {type ChangeEvent, useCallback, useMemo} from 'react'
import {
  type FormPatch,
  getPublishedId,
  type PatchEvent,
  set,
  type StringInputProps,
  unset,
  useDocumentOperation,
  useFormValue,
} from 'sanity'

import type {ExperimentType} from '..'
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

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion - document id from form value
  const id = useFormValue(['_id']) as string
  const additionalChangePath = useMemo(
    () => [...props.path.slice(0, -1), `${props.variantNameOverride}s`],
    [props.variantNameOverride, props.path],
  )
  const subValues = useFormValue(additionalChangePath)

  const {patch} = useDocumentOperation(getPublishedId(id), props.schemaType.name)

  const handleChange = useCallback(
    (
      event: ChangeEvent<HTMLSelectElement>,
      onChange: (patchchange: FormPatch | FormPatch[] | PatchEvent) => void,
    ) => {
      const inputValue = event.currentTarget.value

      if (inputValue) {
        onChange(set(inputValue))
      } else {
        onChange(unset())
      }

      if (subValues) {
        const patchEvent = {
          // oxlint-disable-next-line typescript/no-base-to-string - form path segments are strings or PathSegment
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
