import type {ChangeEvent, FC, Ref} from 'react'

import type {FieldComponentProps} from './types'

// oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- FieldState.ref is loosely typed so refs from any form library can be passed through
const toRef = <T extends HTMLElement>(ref: unknown) => ref as Ref<T> | undefined

export const DefaultField: FC<FieldComponentProps> = ({field, fieldState, error}) => {
  const {type, label, name, options = {}, choices = [], validation = []} = field
  if (!type || !name) return null
  const validationRules = validation.reduce((acc: Record<string, string>, v) => {
    acc[v.type] = v.value
    return acc
  }, {})
  const {value, onChange, onBlur, ref} = fieldState

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    onChange(e.target.value)
  }

  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>, choiceValue: string) => {
    if (Array.isArray(value)) {
      const newValue = e.target.checked
        ? [...value, choiceValue]
        : value.filter((v: string) => v !== choiceValue)
      onChange(newValue)
    } else {
      onChange(e.target.checked ? choiceValue : '')
    }
  }

  const renderInput = () => {
    switch (type) {
      case 'submit':
        return <button type="submit">{label || 'Submit'}</button>
      case 'textarea':
        return (
          <textarea
            ref={toRef<HTMLTextAreaElement>(ref)}
            name={name}
            onChange={handleChange}
            onBlur={onBlur}
            placeholder={options.placeholder}
            {...validationRules}
            value={value ?? ''}
          />
        )

      case 'select':
        return (
          <select
            ref={toRef<HTMLSelectElement>(ref)}
            name={name}
            value={value ?? ''}
            onChange={handleChange}
            {...validationRules}
            onBlur={onBlur}
          >
            {choices?.map((choice) => (
              <option key={choice.value} value={choice.value}>
                {choice.label}
              </option>
            ))}
          </select>
        )

      case 'radio':
        return choices?.map((choice) => (
          <label key={choice.value}>
            <input
              type="radio"
              name={name}
              ref={toRef<HTMLInputElement>(ref)}
              value={choice.value}
              checked={value === choice.value}
              onChange={handleChange}
              onBlur={onBlur}
              {...validationRules}
            />
            {choice.label}
          </label>
        ))

      case 'checkbox':
        return choices?.map((choice) => (
          <label key={choice.value}>
            <input
              type="checkbox"
              name={name}
              ref={toRef<HTMLInputElement>(ref)}
              value={choice.value}
              checked={Array.isArray(value) ? value.includes(choice.value) : value === choice.value}
              onChange={(e) => handleCheckboxChange(e, choice.value)}
              onBlur={onBlur}
              {...validationRules}
            />
            {choice.label}
          </label>
        ))

      default:
        return (
          <input
            type={type}
            ref={toRef<HTMLInputElement>(ref)}
            name={name}
            value={value ?? options.defaultValue ?? ''}
            onChange={handleChange}
            {...validationRules}
            onBlur={onBlur}
            placeholder={options.placeholder}
          />
        )
    }
  }

  return (
    <>
      {label && !['hidden', 'submit'].includes(type) && <label htmlFor={name}>{label}</label>}
      {renderInput()}
      {error && <span className="error">{error}</span>}
    </>
  )
}
