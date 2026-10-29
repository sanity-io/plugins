import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {cleanup, fireEvent, render, screen} from '@testing-library/react'
import {Suspense, useEffect, useState, type ReactNode} from 'react'
import {type ObjectInputProps} from 'sanity'
import {afterEach, expect, test} from 'vitest'

import {ColorInput} from './LazyColorInput'

// Studio passes the full input props. The empty color field only reads these.
// oxlint-disable typescript/no-unsafe-type-assertion -- partial input props for the empty state
const colorInputProps = {
  onChange: () => {},
  readOnly: false,
  schemaType: {name: 'color', fields: []},
  value: undefined,
} as unknown as ObjectInputProps
// oxlint-enable typescript/no-unsafe-type-assertion

afterEach(() => {
  cleanup()
})

function Theme({children}: {children: ReactNode}) {
  const [theme] = useState(() => buildTheme())
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}

/**
 * Studio wraps the document form — field group tabs included — in one Suspense
 * boundary. A color field that suspends past that boundary hides the tabs while
 * the picker loads. The tabs' width subscription then sticks below the first
 * breakpoint, so the tab list is replaced by the narrow-pane dropdown.
 */
let formSuspended = false

function FormFallback() {
  useEffect(() => {
    formSuspended = true
  }, [])
  return <div>Loading form</div>
}

test('showing a color field does not suspend the surrounding form', {timeout: 30_000}, async () => {
  formSuspended = false

  function StudioForm() {
    const [showColor, setShowColor] = useState(false)

    return (
      <Suspense fallback={<FormFallback />}>
        <button type="button" onClick={() => setShowColor(true)}>
          Show color field
        </button>
        {showColor ? <ColorInput {...colorInputProps} /> : <div>Title field</div>}
      </Suspense>
    )
  }

  render(
    <Theme>
      <StudioForm />
    </Theme>,
  )

  fireEvent.click(screen.getByRole('button', {name: 'Show color field'}))

  expect(await screen.findByRole('button', {name: 'Create color'}, {timeout: 15_000})).toBeTruthy()
  expect(formSuspended).toBe(false)
  expect(screen.queryByText('Loading form')).toBeNull()
})
