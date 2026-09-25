import {renderHook} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import type {HttpError} from '../types'
import {useServerErrors} from './useServerErrors'

describe('useServerErrors', () => {
  it('maps the error of a failed request onto a form field, until it clears', () => {
    const {rerender, result} = renderHook(
      ({error}: {error: HttpError | undefined}) => useServerErrors<{name: string}>('name', error),
      {initialProps: {error: undefined} as {error: HttpError | undefined}},
    )
    expect(result.current).toBeUndefined()

    const error = {message: 'Tag already exists', statusCode: 409}
    rerender({error})
    const errors = result.current
    expect(errors).toEqual({name: {message: 'Tag already exists', type: 'server'}})

    // The form applies the errors whenever they change, so the same error keeps the same object
    rerender({error})
    expect(result.current).toBe(errors)

    rerender({error: undefined})
    expect(result.current).toBeUndefined()
  })
})
