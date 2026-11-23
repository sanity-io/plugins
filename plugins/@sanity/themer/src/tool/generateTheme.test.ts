import {describe, expect, it, vi} from 'vitest'

import {buildTheme} from '../theme/buildTheme'
import {
  AGENT_API_VERSION,
  canGenerateThemes,
  generateTheme,
  type GenerateThemeClient,
  GenerateThemeError,
  MAX_GENERATE_ATTEMPTS,
  parseGeneratedTheme,
} from './generateTheme'

const reply = {
  title: 'Autumn Forest',
  light: {accent: '#B45309', background: '#FBF7F2', text: '#6B5E50', contrast: 92},
  dark: {accent: '#F59E0B', background: '#14100C', text: '#9C8B78', contrast: 92},
}

/** A client whose Agent Actions answer with the replies in turn */
function clientReplying(...replies: unknown[]) {
  const prompt = vi.fn<(request: unknown) => Promise<unknown>>()

  for (const item of replies) {
    prompt.mockImplementationOnce(() =>
      item instanceof Error ? Promise.reject(item) : Promise.resolve(item),
    )
  }

  const withConfig = vi.fn(() => ({agent: {action: {prompt}}}))
  const client: GenerateThemeClient = {withConfig}

  return {client, prompt, withConfig}
}

describe('parseGeneratedTheme', () => {
  it('normalizes the colors and keeps the title', () => {
    expect(parseGeneratedTheme(reply)).toEqual({
      success: true,
      theme: {
        title: 'Autumn Forest',
        options: {
          light: {accent: '#b45309', background: '#fbf7f2', text: '#6b5e50', contrast: 92},
          dark: {accent: '#f59e0b', background: '#14100c', text: '#9c8b78', contrast: 92},
        },
      },
    })
  })

  it('builds a theme from what it parses', () => {
    const result = parseGeneratedTheme(reply)

    if (!result.success) throw new Error(result.problem)
    expect(() => buildTheme(result.theme.options)).not.toThrow()
  })

  it('clamps and rounds the contrast, and defaults it when left out', () => {
    const result = parseGeneratedTheme({
      ...reply,
      light: {...reply.light, contrast: 140},
      dark: {accent: '#f59e0b', background: '#14100c', text: '#9c8b78'},
    })

    expect(result.success && result.theme.options).toMatchObject({
      light: {contrast: 100},
      dark: {contrast: 85},
    })
    expect(parseGeneratedTheme({...reply, light: {...reply.light, contrast: 7.6}})).toMatchObject({
      theme: {options: {light: {contrast: 15}}},
    })
    expect(parseGeneratedTheme({...reply, light: {...reply.light, contrast: 50.4}})).toMatchObject({
      theme: {options: {light: {contrast: 50}}},
    })
  })

  it('accepts short hex colors and stray whitespace', () => {
    const result = parseGeneratedTheme({
      ...reply,
      light: {...reply.light, accent: ' #c50 '},
    })

    expect(result.success && result.theme.options.light?.accent).toBe('#c50')
  })

  it('drops a title that is not one, rather than the theme', () => {
    for (const title of [undefined, '', '   ', 42, 'A'.repeat(80), 'Two\nlines']) {
      const result = parseGeneratedTheme({...reply, title})

      expect(result).toMatchObject({success: true, theme: {title: undefined}})
    }
  })

  it('names every option that is missing or not a color', () => {
    const result = parseGeneratedTheme({
      title: 'Broken',
      light: {accent: 'orange', background: '#fff'},
      dark: {accent: '#f59e0b', background: '#14100c', text: '#9c8b78', contrast: 'high'},
    })

    expect(result.success).toBe(false)
    expect(!result.success && result.problem.split('\n')).toEqual([
      'light.accent: expected a hex color like "#c2410c"',
      'light.text: missing',
      'dark.contrast: expected a number',
    ])
  })

  it('rejects backgrounds that mix up the schemes', () => {
    const result = parseGeneratedTheme({
      ...reply,
      light: {...reply.light, background: '#1c1917'},
      dark: {...reply.dark, background: '#e7e5e4'},
    })

    expect(!result.success && result.problem.split('\n')).toEqual([
      'light.background: expected a light color for the light scheme',
      'dark.background: expected a dark color for the dark scheme',
    ])
  })

  it('rejects replies that are not an object', () => {
    for (const response of [null, 'a theme', [reply], 42]) {
      expect(parseGeneratedTheme(response).success).toBe(false)
    }
  })
})

describe('generateTheme', () => {
  it('asks Agent Actions for JSON on the experimental API', async () => {
    const {client, prompt, withConfig} = clientReplying(reply)
    const onAttempt = vi.fn()

    const theme = await generateTheme({request: 'cozy autumn forest', client, onAttempt})

    expect(theme.title).toBe('Autumn Forest')
    expect(withConfig).toHaveBeenCalledWith({apiVersion: AGENT_API_VERSION})
    expect(prompt).toHaveBeenCalledOnce()
    expect(prompt.mock.calls[0]?.[0]).toMatchObject({
      format: 'json',
      instructionParams: {request: 'cozy autumn forest'},
    })
    expect(onAttempt.mock.calls).toEqual([[1]])
  })

  it('retries an unusable reply with what was wrong with it', async () => {
    const broken = {...reply, dark: {...reply.dark, background: 'dark brown'}}
    const {client, prompt} = clientReplying(broken, reply)
    const onAttempt = vi.fn()

    await expect(generateTheme({request: 'autumn', client, onAttempt})).resolves.toMatchObject({
      title: 'Autumn Forest',
    })
    expect(onAttempt.mock.calls).toEqual([[1], [2]])

    const retry = prompt.mock.calls[1]?.[0]

    expect(retry).toMatchObject({instructionParams: {request: 'autumn'}})
    expect(JSON.stringify(retry)).toContain('dark.background: expected a hex color')
    expect(JSON.stringify(retry)).toContain('dark brown')
  })

  it(`gives up after ${MAX_GENERATE_ATTEMPTS} unusable replies`, async () => {
    const {client, prompt} = clientReplying({}, {}, {}, reply)

    await expect(generateTheme({request: 'autumn', client})).rejects.toBeInstanceOf(
      GenerateThemeError,
    )
    expect(prompt).toHaveBeenCalledTimes(MAX_GENERATE_ATTEMPTS)
  })

  it('rejects right away when the request fails', async () => {
    const failure = Object.assign(new Error('Too many requests'), {statusCode: 429})
    const {client, prompt} = clientReplying(failure, reply)

    await expect(generateTheme({request: 'autumn', client})).rejects.toBe(failure)
    expect(prompt).toHaveBeenCalledOnce()
  })

  it('stops when aborted while a reply is on its way', async () => {
    const controller = new AbortController()
    const {client} = clientReplying(reply)
    const generating = generateTheme({request: 'autumn', client, signal: controller.signal})

    controller.abort()

    await expect(generating).rejects.toThrow()
  })
})

describe('canGenerateThemes', () => {
  it('tells clients with Agent Actions from those without', () => {
    expect(canGenerateThemes(clientReplying().client)).toBe(false)
    expect(
      canGenerateThemes({withConfig: () => ({}), agent: {action: {prompt: () => undefined}}}),
    ).toBe(true)
    expect(canGenerateThemes({withConfig: () => ({}), agent: {}})).toBe(false)
    expect(canGenerateThemes(undefined)).toBe(false)
  })
})
