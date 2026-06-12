import {Select as SanitySelect} from '@sanity/ui'
import {FormEvent} from 'react'
import {FormPatch, PatchEvent, Path, StringInputProps} from 'sanity'

import {SelectOption} from './ExperimentInput'

export const Select = (
  props: StringInputProps & {
    listOptions: SelectOption[]
    handleChange: (
      event: FormEvent,
      onChange: (patch: FormPatch | FormPatch[] | PatchEvent) => void,
    ) => void
    aditionalChangePath?: Path
    clearSubValueOnChange?: boolean
  },
) => {
  const {
    value, // Current field value
    onChange, // Method to handle patch events,
    elementProps,
    listOptions,
    handleChange,
  } = props

  return (
    <SanitySelect
      {...elementProps}
      fontSize={2}
      padding={3}
      space={[3, 3, 4]}
      value={value || ''} // Current field value
      onChange={(event) => handleChange(event, onChange)} // A function to call when the input value changes
    >
      <option value={''}>{'Select an option...'}</option>
      {listOptions.map(({value: optionValue, title}) => (
        <option key={optionValue} value={optionValue}>
          {title}
        </option>
      ))}
    </SanitySelect>
  )
}
