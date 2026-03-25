import {render} from '@testing-library/react'
import type {JSX} from 'react'
import {type ObjectInputProps, unset} from 'sanity'
import {describe, expect, test, vi} from 'vitest'

import {LinkFieldInput} from './LinkFieldInput'

function createProps(
  overrides: Partial<{
    linkType: string | undefined
    onChange: ReturnType<typeof vi.fn>
    renderDefault: (props: ObjectInputProps) => JSX.Element
  }> = {},
): ObjectInputProps {
  const onChange = overrides.onChange ?? vi.fn()
  const renderDefault = overrides.renderDefault ?? (() => <div data-testid="default-input" />)

  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
  return {
    onChange,
    renderDefault,
    value: overrides.linkType !== undefined ? {linkType: overrides.linkType} : undefined,
  } as unknown as ObjectInputProps
}

describe('LinkFieldInput', () => {
  test('renders via renderDefault', () => {
    const renderDefault = vi.fn(() => <div data-testid="custom-output" />)
    const props = createProps({renderDefault})

    const {getByTestId} = render(<LinkFieldInput {...props} />)

    expect(getByTestId('custom-output')).toBeInTheDocument()
    expect(renderDefault).toHaveBeenCalledOnce()
    expect(renderDefault).toHaveBeenCalledWith(props)
  })

  test('does not call onChange on initial render', () => {
    const onChange = vi.fn()
    const props = createProps({onChange, linkType: 'internal'})

    render(<LinkFieldInput {...props} />)

    expect(onChange).not.toHaveBeenCalled()
  })

  test('does not call onChange on re-render with same linkType', () => {
    const onChange = vi.fn()
    const props = createProps({onChange, linkType: 'external'})

    const {rerender} = render(<LinkFieldInput {...props} />)

    const updatedProps = createProps({onChange, linkType: 'external'})
    rerender(<LinkFieldInput {...updatedProps} />)

    expect(onChange).not.toHaveBeenCalled()
  })

  test('unsets url and openInNewTab when switching to internal', () => {
    const onChange = vi.fn()
    const initialProps = createProps({onChange, linkType: 'external'})

    const {rerender} = render(<LinkFieldInput {...initialProps} />)

    const updatedProps = createProps({onChange, linkType: 'internal'})
    rerender(<LinkFieldInput {...updatedProps} />)

    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith([unset(['url']), unset(['openInNewTab'])])
  })

  test('unsets reference when switching to external', () => {
    const onChange = vi.fn()
    const initialProps = createProps({onChange, linkType: 'internal'})

    const {rerender} = render(<LinkFieldInput {...initialProps} />)

    const updatedProps = createProps({onChange, linkType: 'external'})
    rerender(<LinkFieldInput {...updatedProps} />)

    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith([unset(['reference'])])
  })

  test('does not call onChange when linkType changes to undefined', () => {
    const onChange = vi.fn()
    const initialProps = createProps({onChange, linkType: 'internal'})

    const {rerender} = render(<LinkFieldInput {...initialProps} />)

    const updatedProps = createProps({onChange, linkType: undefined})
    rerender(<LinkFieldInput {...updatedProps} />)

    expect(onChange).not.toHaveBeenCalled()
  })
})
