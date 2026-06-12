import type {ChangeEvent, FC, LegacyRef} from 'react'

import type {FieldComponentProps} from './types'

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
            ref={ref as LegacyRef<HTMLTextAreaElement>}
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
            ref={ref as LegacyRef<HTMLSelectElement>}
            name={name}
            value={value ?? ''}
            onChange={handleChange}
            {...validationRules}
            onBlur={onBlur}
          >
            {choices?.map((choice, i) => (
              <option key={i} value={choice.value}>
                {choice.label}
              </option>
            ))}
          </select>
        )

      case 'radio':
        return choices?.map((choice, i) => (
          <label key={i}>
            <input
              type="radio"
              name={name}
              ref={ref as LegacyRef<HTMLInputElement>}
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
        return choices?.map((choice, i) => (
          <label key={i}>
            <input
              type="checkbox"
              name={name}
              ref={ref as LegacyRef<HTMLInputElement>}
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
            ref={ref as LegacyRef<HTMLInputElement>}
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
