import {studioTheme, ThemeProvider, ToastProvider} from '@sanity/ui'
import {act, cleanup, render, waitFor} from '@testing-library/react'
import type {InputProps} from 'sanity'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {ToolOptionsProvider} from '../../contexts/ToolOptionsContext'
import {AutoTagInput} from './index'

const applyMediaTagsMock = vi.hoisted(() => vi.fn(() => Promise.resolve()))

vi.mock('../../utils/applyMediaTags', () => ({
  applyMediaTags: applyMediaTagsMock,
}))

vi.mock('../../hooks/useVersionedClient', () => ({
  default: () => ({name: 'mock-client'}),
}))

vi.mock('@sanity/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@sanity/ui')>()
  return {
    ...actual,
    useToast: () => ({push: pushToast}),
  }
})

const pushToast = vi.fn()

function renderAutoTag(
  value: InputProps['value'],
  opts: {
    mediaTags?: string[]
    optionsMediaTags?: string[]
    createTagsOnUpload?: boolean
  } = {},
) {
  const renderDefault = vi.fn(() => <div data-testid="default-input" />)
  const props = {
    renderDefault,
    value,
    mediaTags: opts.mediaTags,
    schemaType: {
      options: opts.optionsMediaTags ? {mediaTags: opts.optionsMediaTags} : undefined,
    },
  } as unknown as InputProps & {mediaTags?: string[]}

  return render(
    <ThemeProvider theme={studioTheme}>
      <ToastProvider>
        <ToolOptionsProvider
          options={{
            creditLine: {enabled: false},
            createTagsOnUpload: opts.createTagsOnUpload,
          }}
        >
          <AutoTagInput {...props} />
        </ToolOptionsProvider>
      </ToastProvider>
    </ThemeProvider>,
  )
}

describe('AutoTagInput', () => {
  beforeEach(() => {
    applyMediaTagsMock.mockClear()
    pushToast.mockClear()
  })

  afterEach(() => {
    cleanup()
  })

  it('does not apply tags on initial mount', async () => {
    renderAutoTag(
      {asset: {_ref: 'asset-1', _type: 'reference'}, _type: 'image'},
      {mediaTags: ['product']},
    )

    await act(async () => {
      await Promise.resolve()
    })

    expect(applyMediaTagsMock).not.toHaveBeenCalled()
  })

  it('applies tags when the asset reference changes', async () => {
    const {rerender} = renderAutoTag(
      {asset: {_ref: 'asset-1', _type: 'reference'}, _type: 'image'},
      {mediaTags: ['product']},
    )

    const renderDefault = vi.fn(() => <div data-testid="default-input" />)
    rerender(
      <ThemeProvider theme={studioTheme}>
        <ToastProvider>
          <ToolOptionsProvider options={{creditLine: {enabled: false}}}>
            <AutoTagInput
              {...({
                renderDefault,
                value: {asset: {_ref: 'asset-2', _type: 'reference'}, _type: 'image'},
                mediaTags: ['product'],
                schemaType: {},
              } as unknown as InputProps & {mediaTags?: string[]})}
            />
          </ToolOptionsProvider>
        </ToastProvider>
      </ThemeProvider>,
    )

    await waitFor(() => {
      expect(applyMediaTagsMock).toHaveBeenCalledWith({
        client: {name: 'mock-client'},
        assetId: 'asset-2',
        mediaTags: ['product'],
        createTagsOnUpload: true,
      })
    })
  })

  it('reads mediaTags from schemaType.options when prop is omitted', async () => {
    const {rerender} = renderAutoTag(
      {asset: {_ref: 'asset-1', _type: 'reference'}, _type: 'image'},
      {optionsMediaTags: ['from-options']},
    )

    const renderDefault = vi.fn(() => <div data-testid="default-input" />)
    rerender(
      <ThemeProvider theme={studioTheme}>
        <ToastProvider>
          <ToolOptionsProvider options={{creditLine: {enabled: false}}}>
            <AutoTagInput
              {...({
                renderDefault,
                value: {asset: {_ref: 'asset-2', _type: 'reference'}, _type: 'image'},
                schemaType: {options: {mediaTags: ['from-options']}},
              } as unknown as InputProps)}
            />
          </ToolOptionsProvider>
        </ToastProvider>
      </ThemeProvider>,
    )

    await waitFor(() => {
      expect(applyMediaTagsMock).toHaveBeenCalledWith(
        expect.objectContaining({mediaTags: ['from-options'], assetId: 'asset-2'}),
      )
    })
  })

  it('passes createTagsOnUpload: false from tool options', async () => {
    const {rerender} = renderAutoTag(
      {asset: {_ref: 'asset-1', _type: 'reference'}, _type: 'image'},
      {mediaTags: ['product'], createTagsOnUpload: false},
    )

    const renderDefault = vi.fn(() => <div data-testid="default-input" />)
    rerender(
      <ThemeProvider theme={studioTheme}>
        <ToastProvider>
          <ToolOptionsProvider options={{creditLine: {enabled: false}, createTagsOnUpload: false}}>
            <AutoTagInput
              {...({
                renderDefault,
                value: {asset: {_ref: 'asset-2', _type: 'reference'}, _type: 'image'},
                mediaTags: ['product'],
                schemaType: {},
              } as unknown as InputProps & {mediaTags?: string[]})}
            />
          </ToolOptionsProvider>
        </ToastProvider>
      </ThemeProvider>,
    )

    await waitFor(() => {
      expect(applyMediaTagsMock).toHaveBeenCalledWith(
        expect.objectContaining({createTagsOnUpload: false}),
      )
    })
  })

  it('shows an error toast when applyMediaTags rejects', async () => {
    applyMediaTagsMock.mockRejectedValueOnce(new Error('boom'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const {rerender} = renderAutoTag(
      {asset: {_ref: 'asset-1', _type: 'reference'}, _type: 'image'},
      {mediaTags: ['product']},
    )

    const renderDefault = vi.fn(() => <div data-testid="default-input" />)
    rerender(
      <ThemeProvider theme={studioTheme}>
        <ToastProvider>
          <ToolOptionsProvider options={{creditLine: {enabled: false}}}>
            <AutoTagInput
              {...({
                renderDefault,
                value: {asset: {_ref: 'asset-2', _type: 'reference'}, _type: 'image'},
                mediaTags: ['product'],
                schemaType: {},
              } as unknown as InputProps & {mediaTags?: string[]})}
            />
          </ToolOptionsProvider>
        </ToastProvider>
      </ThemeProvider>,
    )

    await waitFor(() => {
      expect(pushToast).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          title: 'Failed to apply the media tag product',
        }),
      )
    })

    consoleSpy.mockRestore()
  })
})
