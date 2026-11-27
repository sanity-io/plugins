import {EditIcon} from '@sanity/icons/Edit'
import {LaunchIcon} from '@sanity/icons/Launch'
import {SparklesIcon} from '@sanity/icons/Sparkles'
import {UndoIcon} from '@sanity/icons/Undo'
import {Button, Card, Flex, Stack, Text, TextArea} from '@sanity/ui'
import {useSelector} from '@xstate/react'
import {type KeyboardEvent, type RefObject, useEffect, useRef, useState} from 'react'

import type {ThemerProps} from '#types'

import {
  AI_CREDITS_DOCS_URL,
  type AiCredits,
  type AiCreditsClient,
  aiSpendingLimitUrl,
  aiUsageUrl,
  fetchAiCredits,
  readAiCreditsLimit,
} from './aiCredits'
import {type GenerateThemeClient, generateTheme, MAX_GENERATE_ATTEMPTS} from './generateTheme'
import {CONFIG_SLUG} from './themes'

import * as styles from './GenerateThemeBar.module.css'

type GenerateStatus =
  | {type: 'idle'}
  | {type: 'generating'; attempt: number}
  | {
      type: 'failed'
      message: string
      /** The credits the request was turned down for, when that is what failed */
      limit: AiCredits | undefined
    }
  | {
      type: 'generated'
      slug: string
      title: string
      /** The theme that was applied before, which undo applies again */
      previous: string
    }

/** @internal */
export interface GenerateThemeBarProps extends Pick<ThemerProps, 'actorRef'> {
  client: GenerateThemeClient & AiCreditsClient
  onClose: () => void
  /** The request that is running. Closing the bar aborts it */
  requestRef: RefObject<AbortController | null>
  /**
   * Ends with the list: leaving the list or closing the themer aborts it, and
   * the running request is linked to it so a result can't apply out of sight
   */
  sessionRef: RefObject<AbortController | null>
}

const MAX_TITLE_FROM_REQUEST = 32

/** A title for a theme the reply did not name: the start of its description */
function titleFromRequest(request: string): string {
  const title =
    request.length > MAX_TITLE_FROM_REQUEST
      ? `${request.slice(0, MAX_TITLE_FROM_REQUEST).trimEnd()}…`
      : request

  return title.charAt(0).toUpperCase() + title.slice(1)
}

/**
 * Comes up with a theme from a description with Agent Actions, at the top
 * of the list. The theme is added to the list and applied, so the whole
 * Studio previews it; undo deletes it and applies the theme from before, and
 * edit opens it in the editor. Closing the bar keeps it.
 *
 * @internal
 */
export function GenerateThemeBar({
  actorRef,
  client,
  onClose,
  requestRef,
  sessionRef,
}: GenerateThemeBarProps) {
  const [request, setRequest] = useState('')
  const [status, setStatus] = useState<GenerateStatus>({type: 'idle'})
  const [credits, setCredits] = useState<AiCredits | undefined>(undefined)
  const fieldRef = useRef<HTMLTextAreaElement>(null)
  const generatedSlug = status.type === 'generated' ? status.slug : null
  const generatedExists = useSelector(
    actorRef,
    (snapshot) =>
      generatedSlug !== null &&
      snapshot.context.custom.some((theme) => theme.slug === generatedSlug),
  )

  useEffect(() => {
    const controller = new AbortController()

    void (async () => {
      try {
        const result = await fetchAiCredits(client, controller.signal)

        if (!controller.signal.aborted) setCredits(result)
      } catch {
        // Nothing depends on the credits: a failed reading leaves them unknown
      }
    })()

    return () => controller.abort()
  }, [client])

  const generating = status.type === 'generating'

  const generate = async () => {
    const description = request.trim()

    if (!description || generating) return

    requestRef.current?.abort()
    const controller = new AbortController()
    const session = sessionRef.current

    requestRef.current = controller
    setStatus({type: 'generating', attempt: 1})
    // The button that started this loses focus once it is loading, and Escape has to reach the bar
    fieldRef.current?.focus()

    // Ending the session while the request is still running also ends the bar's
    // generation, even though the bar is hidden and the prompt call has not
    // settled. A result that is already showing is left as it is.
    const endWithSession = () => {
      controller.abort()
      if (requestRef.current === controller) {
        setStatus((current) => (current.type === 'generating' ? {type: 'idle'} : current))
      }
    }

    if (session?.signal.aborted) endWithSession()
    else session?.signal.addEventListener('abort', endWithSession, {once: true})

    try {
      const generated = await generateTheme({
        request: description,
        client,
        signal: controller.signal,
        onAttempt: (attempt) => setStatus({type: 'generating', attempt}),
      })

      session?.signal.removeEventListener('abort', endWithSession)

      if (controller.signal.aborted) {
        if (requestRef.current === controller) setStatus({type: 'idle'})
        return
      }

      const previous = actorRef.getSnapshot().context.active ?? CONFIG_SLUG
      const title = generated.title ?? titleFromRequest(description)

      actorRef.send({type: 'theme.import', title, options: generated.options})
      // Importing applies the new theme, so it is the applied one now
      const slug = actorRef.getSnapshot().context.active ?? CONFIG_SLUG

      setStatus({type: 'generated', slug, title, previous})
    } catch (error) {
      session?.signal.removeEventListener('abort', endWithSession)

      if (controller.signal.aborted) {
        if (requestRef.current === controller) setStatus({type: 'idle'})
        return
      }

      const limit = readAiCreditsLimit(error)

      if (limit) setCredits(limit)
      setStatus({
        type: 'failed',
        message: error instanceof Error ? error.message : String(error),
        limit,
      })
    }
  }

  const cancel = () => {
    requestRef.current?.abort()
    setStatus({type: 'idle'})
  }

  const undo = (generated: Extract<GenerateStatus, {type: 'generated'}>) => {
    const applied = actorRef.getSnapshot().context.active === generated.slug

    actorRef.send({type: 'theme.delete', slug: generated.slug})
    // Only what the generated theme replaced comes back, not what was picked since
    if (applied) actorRef.send({type: 'theme.pick', slug: generated.previous})
    setStatus({type: 'idle'})
  }

  // Escape from anywhere in the bar: cancels a generation, or closes the bar
  const handleEscape = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Escape') return

    event.preventDefault()
    if (generating) cancel()
    else onClose()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void generate()
    }
  }

  // The credits as the failed request reported them, or as last read while nothing is going on
  const shownCredits =
    status.type === 'failed' ? status.limit : status.type === 'idle' ? credits : undefined
  const atLimit = shownCredits?.granted === false
  const {apiHost} = client.config()

  return (
    <Card
      borderBottom
      className={styles.bar}
      data-testid="themer-generate-bar"
      onKeyDown={handleEscape}
      padding={3}
    >
      <Stack gap={3}>
        <TextArea
          ref={fieldRef}
          aria-label="Describe a theme"
          // Password managers ignore `autoComplete`, so each of them also gets its own opt-out
          autoComplete="off"
          autoFocus
          data-1p-ignore
          data-bwignore
          data-form-type="other"
          data-lpignore="true"
          data-testid="themer-generate-request"
          readOnly={generating}
          fontSize={1}
          onChange={(event) => setRequest(event.currentTarget.value)}
          onKeyDown={handleKeyDown}
          padding={2}
          placeholder="Cozy autumn forest, high contrast"
          rows={2}
          value={request}
        />
        <Flex gap={2} justify="flex-end">
          <Button
            data-testid="themer-generate-close"
            fontSize={1}
            mode="bleed"
            onClick={generating ? cancel : onClose}
            padding={2}
            text={generating ? 'Cancel' : 'Close'}
          />
          <Button
            data-testid="themer-generate-submit"
            disabled={!request.trim() || generating}
            fontSize={1}
            icon={SparklesIcon}
            loading={generating}
            onClick={() => void generate()}
            padding={2}
            text="Generate"
            tone="primary"
          />
        </Flex>

        {status.type === 'idle' && !atLimit && (
          <Text className={styles.status} muted size={0}>
            Describe a mood, a place or a few colors. Sanity Agent Actions pick the colors of both
            color schemes, and every attempt uses one AI credit.
          </Text>
        )}

        {status.type === 'generating' && (
          <Text className={styles.status} data-testid="themer-generate-progress" muted size={1}>
            {status.attempt > 1
              ? `Fixing the colors (attempt ${status.attempt} of ${MAX_GENERATE_ATTEMPTS})…`
              : 'Picking colors…'}
          </Text>
        )}

        {status.type === 'failed' && !atLimit && (
          <Card
            className={styles.status}
            data-testid="themer-generate-error"
            padding={3}
            radius={2}
            role="alert"
            tone="critical"
          >
            <Stack gap={3}>
              <Text size={1} weight="medium">
                The theme could not be generated
              </Text>
              <Text className={styles.message} size={1}>
                {status.message}
              </Text>
            </Stack>
          </Card>
        )}

        {status.type === 'generated' && generatedExists && (
          <Card
            className={styles.status}
            data-testid="themer-generate-result"
            padding={3}
            radius={2}
            tone="positive"
          >
            <Stack gap={3}>
              <Text size={1}>
                Added and applied <strong>{status.title}</strong>
              </Text>
              <Flex gap={1} justify="flex-end">
                <Button
                  data-testid="themer-generate-undo"
                  fontSize={1}
                  icon={UndoIcon}
                  mode="bleed"
                  onClick={() => undo(status)}
                  padding={2}
                  text="Undo"
                />
                <Button
                  fontSize={1}
                  icon={EditIcon}
                  mode="ghost"
                  onClick={() => actorRef.send({type: 'theme.edit', slug: status.slug})}
                  padding={2}
                  text="Edit"
                />
              </Flex>
            </Stack>
          </Card>
        )}

        <AiCreditsStatus apiHost={apiHost} credits={shownCredits} />
      </Stack>
    </Card>
  )
}

function format(value: number): string {
  return value.toLocaleString()
}

/**
 * What the AI credits mean for generating: nothing while they are unknown,
 * how many are left while requests go through, and the way to more of them
 * once the spending limit is reached
 */
function AiCreditsStatus({
  credits,
  apiHost,
}: {
  credits: AiCredits | undefined
  apiHost: string | undefined
}) {
  if (!credits) return null

  if (!credits.granted) {
    const {used, quota} = credits

    return (
      <Card border data-testid="themer-ai-credits-limit" padding={3} radius={2}>
        <Stack gap={3}>
          <Text size={1} weight="medium">
            Out of AI credits
          </Text>
          <Text muted size={1}>
            {used === undefined || quota === undefined
              ? 'Your organization has used up its AI credits for this month.'
              : `Your organization has used ${format(used)} of its ${format(quota)} AI credits this month.`}{' '}
            Generating works again once the limit is raised or the month turns.
          </Text>
          <Flex gap={2} justify="flex-end" wrap="wrap">
            <Button
              as="a"
              fontSize={1}
              href={AI_CREDITS_DOCS_URL}
              iconRight={LaunchIcon}
              mode="bleed"
              padding={2}
              rel="noreferrer"
              target="_blank"
              text="How AI credits work"
            />
            <Button
              as="a"
              fontSize={1}
              href={aiSpendingLimitUrl(apiHost)}
              padding={2}
              rel="noreferrer"
              target="_blank"
              text="Manage AI credits"
              tone="primary"
            />
          </Flex>
        </Stack>
      </Card>
    )
  }

  if (credits.used === undefined) return null

  const {used, quota} = credits
  const note =
    quota === undefined
      ? `${format(used)} AI credits used this month.`
      : used > quota
        ? `${format(used)} of ${format(quota)} AI credits used this month, ${format(used - quota)} over.`
        : `${format(quota - used)} of ${format(quota)} AI credits left this month.`

  return (
    <Text data-testid="themer-ai-credits" muted size={0}>
      {note}{' '}
      <a href={aiUsageUrl(apiHost)} rel="noreferrer" target="_blank">
        AI usage
      </a>
    </Text>
  )
}
