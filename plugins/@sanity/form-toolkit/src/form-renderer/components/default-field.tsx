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
  // Without an onChange handler the fields render as uncontrolled inputs, so the
  // browser keeps them interactive (e.g. the default native-form usage). When a
  // handler is provided (react-hook-form, TanStack Form, etc.) they're controlled.
  const isControlled = typeof onChange === 'function'

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    onChange?.(e.target.value)
  }

  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>, choiceValue: string) => {
    if (Array.isArray(value)) {
      const newValue = e.target.checked
        ? [...value, choiceValue]
        : value.filter((v: string) => v !== choiceValue)
      onChange?.(newValue)
    } else {
      onChange?.(e.target.checked ? choiceValue : '')
    }
  }

  // Controlled inputs bind `value`/`onChange` from form state only — never the
  // schema default, which would desync the UI from what the form library submits.
  // Uncontrolled (native) inputs use `defaultValue` so the browser owns state.
  const textValueProps = (fallback?: string) =>
    isControlled ? {value: value ?? '', onChange: handleChange} : {defaultValue: fallback}

  const renderInput = () => {
    switch (type) {
      case 'submit':
        return <button type="submit">{label || 'Submit'}</button>
      case 'textarea':
        return (
          <textarea
            ref={toRef<HTMLTextAreaElement>(ref)}
            name={name}
            onBlur={onBlur}
            placeholder={options.placeholder}
            {...validationRules}
            {...textValueProps(options.defaultValue)}
          />
        )

      case 'select':
        return (
          <select
            ref={toRef<HTMLSelectElement>(ref)}
            name={name}
            {...textValueProps()}
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
              onBlur={onBlur}
              {...validationRules}
              {...(isControlled ? {checked: value === choice.value, onChange: handleChange} : {})}
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
              onBlur={onBlur}
              {...validationRules}
              {...(isControlled
                ? {
                    checked: Array.isArray(value)
                      ? value.includes(choice.value)
                      : value === choice.value,
                    onChange: (e: ChangeEvent<HTMLInputElement>) =>
                      handleCheckboxChange(e, choice.value),
                  }
                : {})}
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
            {...textValueProps(options.defaultValue)}
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
