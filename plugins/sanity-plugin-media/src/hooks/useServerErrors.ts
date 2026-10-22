import {useMemo} from 'react'
import type {FieldErrors, FieldValues, Path} from 'react-hook-form'

import type {HttpError} from '../types'

/**
 * Maps an error from a failed request onto a form field, for the `errors` option of `useForm`.
 * React Hook Form applies the errors whenever this object changes, so it only changes with the
 * error itself.
 */
export function useServerErrors<TFieldValues extends FieldValues>(
  name: Path<TFieldValues>,
  error: HttpError | undefined,
): FieldErrors<TFieldValues> | undefined {
  return useMemo(
    () =>
      error
        ? ({[name]: {message: error.message, type: 'server'}} as FieldErrors<TFieldValues>)
        : undefined,
    [error, name],
  )
}
