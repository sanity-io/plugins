import * as v from 'valibot'

import {isColor} from '../lib/mix'
import {relativeLuminance} from '../theme/hsl'
import {
  type BuildThemeOptions,
  DEFAULT_CONTRAST,
  MAXIMUM_CONTRAST,
  MINIMUM_CONTRAST,
} from '../theme/options'

/** The Agent Actions request `generateTheme` sends, a subset of `PromptRequest` in `@sanity/client` */
interface GenerateThemePromptRequest {
  instruction: string
  instructionParams: Record<string, string>
  format: 'json'
  temperature: number
}

/** What `generateTheme` needs of a client; a `SanityClient` has it @internal */
export interface GenerateThemeClient {
  withConfig: (config: {apiVersion: string}) => {
    agent: {action: {prompt: (request: GenerateThemePromptRequest) => Promise<unknown>}}
  }
}

/** Agent Actions only exist on the experimental API @internal */
export const AGENT_API_VERSION = 'vX'

/** @internal */
export const MAX_GENERATE_ATTEMPTS = 3

const MAX_TITLE_LENGTH = 40

/**
 * How far the backgrounds may stray towards the other scheme, in relative
 * luminance: a light background stays at least as light as `#bcbcbc`, a dark
 * one at most as light as `#444`, so the generated theme reads as light and
 * dark rather than as two muddy middles
 */
const MINIMUM_LIGHT_BACKGROUND_LUMINANCE = 0.5
const MAXIMUM_DARK_BACKGROUND_LUMINANCE = 0.06

const INSTRUCTION = `You design color themes for Sanity Studio, a content editing app with a light and a dark color scheme.

The theme should evoke:
$request

Each scheme has four options:
- "accent": the brand color, a hex color like "#c2410c", used for primary buttons, links and focus rings. It must stand out from the scheme's background.
- "background": a hex color every other color is blended onto. The light scheme's is a very light color (near white, optionally tinted), the dark scheme's a very dark color (near black, optionally tinted).
- "text": a hex color for text, icons and borders, usually a muted color in the middle of the lightness range. The app derives the darker and lighter shades from it, so do not pick near black or near white.
- "contrast": a whole number from ${MINIMUM_CONTRAST} to ${MAXIMUM_CONTRAST}. ${DEFAULT_CONTRAST} uses the text color as is, ${MAXIMUM_CONTRAST} makes text fully neutral (high contrast), and lower values mix more of the accent into the text.

Reply with JSON: an object with "title" (a name for the theme of at most three words), "light" and "dark" (each an object with "accent", "background", "text" and "contrast").`

const RETRY_INSTRUCTION = `${INSTRUCTION}

Your previous reply could not be used:
$previous

Fix that problem in your reply.`

/** A theme Agent Actions came up with, checked and ready to add @internal */
export interface GeneratedTheme {
  /** A name for the theme; `undefined` when the reply had none that fits */
  title: string | undefined
  options: BuildThemeOptions
}

/** Every attempt was unusable or rejected @internal */
export class GenerateThemeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GenerateThemeError'
  }
}

/** A `#rgb` or `#rrggbb` color, lowercased; models often reply in uppercase */
const color = v.pipe(
  v.string('expected a hex color like "#c2410c"'),
  v.trim(),
  v.check(isColor, 'expected a hex color like "#c2410c"'),
  v.toLowerCase(),
)

/** A contrast, clamped into range and rounded — the default when the reply leaves it out */
const contrast = v.optional(
  v.pipe(
    v.number('expected a number'),
    v.finite('expected a finite number'),
    v.toMinValue(MINIMUM_CONTRAST),
    v.toMaxValue(MAXIMUM_CONTRAST),
    v.transform(Math.round),
  ),
  DEFAULT_CONTRAST,
)

function schemeSchema(check: (luminance: number) => boolean, message: string) {
  return v.object({
    accent: color,
    background: v.pipe(
      color,
      v.check((value) => check(relativeLuminance(value)), message),
    ),
    text: color,
    contrast,
  })
}

/** A title of a few words, dropped rather than failing the theme when it is not one */
const title = v.fallback(
  v.optional(
    v.pipe(
      v.string(),
      v.trim(),
      v.nonEmpty(),
      v.maxLength(MAX_TITLE_LENGTH),
      v.check((value) => !/[\n\r]/.test(value)),
    ),
  ),
  undefined,
)

/**
 * The reply Agent Actions are asked for: a title, and every option of both
 * schemes, with backgrounds that are clearly light and dark. Colors are
 * normalized and the contrast clamped, so a reply that is almost right is
 * used; one that misses a color or mixes up the schemes is not.
 */
const generatedThemeSchema = v.pipe(
  v.object({
    title,
    light: schemeSchema(
      (luminance) => luminance >= MINIMUM_LIGHT_BACKGROUND_LUMINANCE,
      'expected a light color for the light scheme',
    ),
    dark: schemeSchema(
      (luminance) => luminance <= MAXIMUM_DARK_BACKGROUND_LUMINANCE,
      'expected a dark color for the dark scheme',
    ),
  }),
  v.transform(({title, light, dark}): GeneratedTheme => ({title, options: {light, dark}})),
)

/** @internal */
export type ParsedGeneratedTheme =
  | {success: true; theme: GeneratedTheme}
  | {success: false; problem: string}

/**
 * Checks a reply against {@link generatedThemeSchema}, describing what is
 * wrong with it the way the model can act on: each issue with the path of
 * the option it is about.
 *
 * @internal
 */
export function parseGeneratedTheme(response: unknown): ParsedGeneratedTheme {
  const result = v.safeParse(generatedThemeSchema, response)

  if (result.success) return {success: true, theme: result.output}

  const problem = result.issues
    .map((issue) => {
      const path = v.getDotPath(issue)
      const message = issue.received === 'undefined' ? 'missing' : issue.message

      return path ? `${path}: ${message}` : message
    })
    .join('\n')

  return {success: false, problem}
}

/** Whether the client can make Agent Actions requests; clients of older Studios cannot @internal */
export function canGenerateThemes(client: unknown): client is GenerateThemeClient {
  const agent = property(client, 'agent')
  const action = property(agent, 'action')

  return (
    typeof property(client, 'withConfig') === 'function' &&
    typeof property(action, 'prompt') === 'function'
  )
}

function property(value: unknown, key: string): unknown {
  if (typeof value !== 'object' || value === null) return undefined

  const result: unknown = Reflect.get(value, key)

  return result
}

/** @internal */
export interface GenerateThemeOptions {
  /** What the theme should evoke, in the user's words */
  request: string
  client: GenerateThemeClient
  /** Called as each attempt starts, from 1 */
  onAttempt?: (attempt: number) => void
  signal?: AbortSignal
}

/**
 * Comes up with theme options for a description with Agent Actions
 * (`client.agent.action.prompt`): the description and what the options mean
 * go in, and the JSON that comes back is checked with
 * {@link parseGeneratedTheme}. An unusable reply is retried with what was
 * wrong with it, up to {@link MAX_GENERATE_ATTEMPTS} times. A failing prompt
 * request (no access to Agent Actions, out of AI credits) rejects right away.
 *
 * @internal
 */
export async function generateTheme(options: GenerateThemeOptions): Promise<GeneratedTheme> {
  const {request, client, onAttempt, signal} = options
  const agent = client.withConfig({apiVersion: AGENT_API_VERSION}).agent.action
  let previous: {response: unknown; problem: string} | undefined

  for (let attempt = 1; attempt <= MAX_GENERATE_ATTEMPTS; attempt++) {
    signal?.throwIfAborted()
    onAttempt?.(attempt)
    // oxlint-disable-next-line no-await-in-loop -- each attempt is asked with the previous one's problem
    const response: unknown = await agent.prompt({
      instruction: previous ? RETRY_INSTRUCTION : INSTRUCTION,
      instructionParams: {
        request,
        ...(previous
          ? {previous: `${JSON.stringify(previous.response)}\nProblems:\n${previous.problem}`}
          : {}),
      },
      format: 'json',
      temperature: 0.3,
    })
    signal?.throwIfAborted()

    const parsed = parseGeneratedTheme(response)

    if (parsed.success) return parsed.theme

    previous = {response, problem: parsed.problem}
  }

  throw new GenerateThemeError(
    previous
      ? `The colors that came back could not be used:\n${previous.problem}`
      : 'No theme was generated',
  )
}
