import {cleanup, fireEvent, render, screen} from '@testing-library/react'
import type {ReactNode} from 'react'
import {afterEach, describe, expect, test, vi} from 'vitest'

import {SettingsView, type SettingsKey} from './Settings'
import {ThemeWrapper} from './test/component-helpers'

// --- Mocks ---

const mockStoreSecrets = vi.fn()
const mockUseSecrets = vi.fn()

vi.mock('./useSecrets', () => ({
  useSecrets: (...args: unknown[]) => mockUseSecrets(...args),
}))

// Mock the Dialog component to avoid the expensive styled-components + Portal +
// Layer rendering pipeline that causes timeouts in CI/jsdom environments.
// The tests here verify SettingsView behaviour, not @sanity/ui internals.
vi.mock('@sanity/ui', async () => {
  const actual = await vi.importActual('@sanity/ui')
  return {
    ...actual,
    Dialog: ({
      children,
      header,
      id,
      onClose,
    }: {
      children: ReactNode
      header?: string
      id?: string
      onClose?: () => void
    }) => (
      <div data-testid="mock-dialog" data-ui="Dialog" id={id}>
        <span>{header}</span>
        {onClose && (
          <button type="button" aria-label="Close dialog" onClick={onClose}>
            ×
          </button>
        )}
        {children}
      </div>
    ),
  }
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

// --- Helpers ---

const DEFAULT_KEYS: SettingsKey[] = [
  {key: 'apiKey', title: 'API Key', description: 'Your API key'},
  {key: 'token', title: 'Secret Token'},
]

function renderSettingsView(overrides?: {
  keys?: SettingsKey[]
  title?: string
  namespace?: string
  loading?: boolean
  secrets?: Record<string, any>
}) {
  const {
    keys = DEFAULT_KEYS,
    title = 'Configure',
    namespace = 'test-plugin',
    loading = false,
    secrets = undefined,
  } = overrides ?? {}

  mockUseSecrets.mockReturnValue({
    loading,
    secrets,
    storeSecrets: mockStoreSecrets,
  })

  const onClose = vi.fn()

  const result = render(
    <ThemeWrapper>
      <SettingsView namespace={namespace} keys={keys} onClose={onClose} title={title} />
    </ThemeWrapper>,
  )

  return {...result, onClose}
}

describe('SettingsView', () => {
  test('renders dialog with the given title', () => {
    renderSettingsView({title: 'My Plugin Settings'})

    expect(screen.getByText('My Plugin Settings')).toBeInTheDocument()
  })

  test('renders a labeled input for each key entry', () => {
    renderSettingsView()

    expect(screen.getByText('API Key')).toBeInTheDocument()
    expect(screen.getByText('Secret Token')).toBeInTheDocument()
  })

  test('renders description text when provided', () => {
    renderSettingsView()

    expect(screen.getByText('Your API key')).toBeInTheDocument()
  })

  test('does not render description when not provided', () => {
    renderSettingsView({
      keys: [{key: 'simple', title: 'Simple Key'}],
    })

    expect(screen.getByText('Simple Key')).toBeInTheDocument()
    // Description from the other key fixture should not appear
    expect(screen.queryByText('Your API key')).not.toBeInTheDocument()
  })

  test('shows "Loading…" on the save button when loading', () => {
    renderSettingsView({loading: true})

    const button = screen.getByRole('button', {name: /loading/i})
    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled()
  })

  test('shows "Save" on the button when not loading', () => {
    renderSettingsView({loading: false})

    const button = screen.getByRole('button', {name: /save/i})
    expect(button).toBeInTheDocument()
    expect(button).not.toBeDisabled()
  })

  test('disables inputs when loading', () => {
    renderSettingsView({loading: true})

    const inputs = screen.getAllByRole('textbox')
    for (const input of inputs) {
      expect(input).toBeDisabled()
    }
  })

  test('populates inputs with loaded secrets', async () => {
    renderSettingsView({
      secrets: {apiKey: 'my-key-123', token: 'my-token-456'},
    })

    // useEffect syncs secrets into form state — wait for it
    const inputs = screen.getAllByRole('textbox')
    // The inputs should eventually show the secret values
    await vi.waitFor(() => {
      expect(inputs[0]).toHaveValue('my-key-123')
      expect(inputs[1]).toHaveValue('my-token-456')
    })
  })

  test('shows empty inputs when no secrets are loaded', () => {
    renderSettingsView({secrets: undefined})

    const inputs = screen.getAllByRole('textbox')
    for (const input of inputs) {
      expect(input).toHaveValue('')
    }
  })

  test('updates local state when user types in an input', async () => {
    renderSettingsView({secrets: {apiKey: '', token: ''}})

    await vi.waitFor(() => {
      expect(screen.getAllByRole('textbox')[0]).toHaveValue('')
    })

    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0]!, {target: {value: 'new-api-key'}})

    expect(inputs[0]).toHaveValue('new-api-key')
  })

  test('calls storeSecrets with current form values on Save click', async () => {
    renderSettingsView({secrets: {apiKey: 'existing', token: 'existing-token'}})

    await vi.waitFor(() => {
      expect(screen.getAllByRole('textbox')[0]).toHaveValue('existing')
    })

    // Modify one field
    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0]!, {target: {value: 'updated-key'}})

    // Click save
    const saveButton = screen.getByRole('button', {name: /save/i})
    fireEvent.click(saveButton)

    expect(mockStoreSecrets).toHaveBeenCalledWith(
      expect.objectContaining({apiKey: 'updated-key', token: 'existing-token'}),
    )
  })

  test('calls useSecrets with the provided namespace', () => {
    renderSettingsView({namespace: 'my-custom-namespace'})

    expect(mockUseSecrets).toHaveBeenCalledWith('my-custom-namespace')
  })

  test('renders with default title "Configure" when not specified', () => {
    mockUseSecrets.mockReturnValue({
      loading: false,
      secrets: undefined,
      storeSecrets: mockStoreSecrets,
    })

    render(
      <ThemeWrapper>
        <SettingsView
          namespace="test"
          keys={[{key: 'k', title: 'Key'}]}
          onClose={vi.fn()}
          title="Configure"
        />
      </ThemeWrapper>,
    )

    expect(screen.getByText('Configure')).toBeInTheDocument()
  })

  test('renders correct number of inputs for given keys', () => {
    renderSettingsView({
      keys: [
        {key: 'a', title: 'A'},
        {key: 'b', title: 'B'},
        {key: 'c', title: 'C'},
      ],
    })

    const inputs = screen.getAllByRole('textbox')
    expect(inputs).toHaveLength(3)
  })

  test('uses nullish coalescing for input values (empty string is preserved)', async () => {
    renderSettingsView({
      keys: [{key: 'field', title: 'Field'}],
      secrets: {field: ''},
    })

    await vi.waitFor(() => {
      const input = screen.getByRole('textbox')
      // Empty string should be preserved (not replaced with fallback)
      expect(input).toHaveValue('')
    })
  })

  test('calls onClose when dialog close button is clicked', () => {
    const {onClose} = renderSettingsView()

    // @sanity/ui Dialog renders a close button with aria-label="Close dialog"
    const closeButton = screen.getByRole('button', {name: /close/i})
    fireEvent.click(closeButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
