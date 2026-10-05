import {Badge, Card, Flex, Stack, Text} from '@sanity/ui'
import type {ReactElement, ReactNode} from 'react'

import {
  asRows,
  asStrings,
  EM_DASH,
  formatOffset,
  formatOffsetMs,
  formatScore,
  formatText,
} from '../../robots/format'
import type {RobotsWorkflow} from '../../robots/types'
import {RobotsJsonBlock} from './RobotsJsonBlock'
import {RobotsNote} from './RobotsNote'

/**
 * Per-workflow views of a job's `outputs`. Each says whether it can draw what it got, so a
 * payload it can't read falls back to the raw JSON rather than an empty view.
 */

type Outputs = Record<string, unknown>

interface OutputView {
  hasContent: (outputs: Outputs) => boolean
  render: (outputs: Outputs) => ReactElement
}

function Labelled({label, children}: {label: string; children: ReactNode}) {
  return (
    <Stack gap={2}>
      <Text size={1} weight="semibold">
        {label}
      </Text>
      {children}
    </Stack>
  )
}

function RowCard({title, meta, children}: {title: string; meta?: string; children?: ReactNode}) {
  return (
    <Card padding={3} radius={2} border>
      <Stack gap={3}>
        <Text size={1} weight="semibold">
          {title}
        </Text>
        {meta && (
          <Text size={1} muted>
            {meta}
          </Text>
        )}
        {children}
      </Stack>
    </Card>
  )
}

function Tags({tags, tone = 'default'}: {tags: string[]; tone?: 'default' | 'primary'}) {
  return (
    <Flex gap={1} wrap="wrap">
      {tags.map((tag) => (
        <Badge key={tag} tone={tone} fontSize={1} padding={2}>
          {tag}
        </Badge>
      ))}
    </Flex>
  )
}

const SUMMARIZE: OutputView = {
  hasContent: (outputs) =>
    typeof outputs['title'] === 'string' ||
    typeof outputs['description'] === 'string' ||
    asStrings(outputs['tags']).length > 0,
  render: (outputs) => (
    <Stack gap={4}>
      {typeof outputs['title'] === 'string' && (
        <Labelled label="Title">
          <Text size={1}>{outputs['title']}</Text>
        </Labelled>
      )}
      {typeof outputs['description'] === 'string' && (
        <Labelled label="Description">
          <Text size={1}>{outputs['description']}</Text>
        </Labelled>
      )}
      {asStrings(outputs['tags']).length > 0 && (
        <Labelled label="Tags">
          <Tags tags={asStrings(outputs['tags'])} />
        </Labelled>
      )}
    </Stack>
  ),
}

const MODERATE: OutputView = {
  hasContent: (outputs) =>
    typeof outputs['exceeds_threshold'] === 'boolean' ||
    Object.keys(outputs['max_scores'] ?? {}).length > 0,
  render: (outputs) => (
    <Stack gap={3}>
      <Flex>
        <Badge
          tone={outputs['exceeds_threshold'] ? 'critical' : 'positive'}
          fontSize={1}
          padding={2}
        >
          {outputs['exceeds_threshold'] ? 'Exceeds a threshold' : 'Within thresholds'}
        </Badge>
      </Flex>
      {Object.entries((outputs['max_scores'] ?? {}) as Outputs).map(([category, score]) => (
        <Text key={category} size={1}>
          Highest {category} score: {formatScore(score)}
        </Text>
      ))}
    </Stack>
  ),
}

const ASK_QUESTIONS: OutputView = {
  hasContent: (outputs) => asRows(outputs['answers']).length > 0,
  render: (outputs) => (
    <Stack gap={2}>
      {asRows(outputs['answers']).map((answer, index) => (
        <RowCard
          // oxlint-disable-next-line react/no-array-index-key -- read-only output, never reorders
          key={index}
          title={formatText(answer['question'])}
          meta={`Confidence ${formatScore(answer['confidence'])}`}
        >
          {answer['skipped'] ? (
            <Flex>
              <Badge fontSize={1} padding={2}>
                Skipped
              </Badge>
            </Flex>
          ) : (
            <Text size={1}>{formatText(answer['answer'])}</Text>
          )}
          {typeof answer['reasoning'] === 'string' && (
            <Text size={1} muted>
              {answer['reasoning']}
            </Text>
          )}
        </RowCard>
      ))}
    </Stack>
  ),
}

/** `asset_update` is present only when the job ran with `update_asset_chapters`. */
function ChaptersAssetUpdateNote({assetUpdate}: {assetUpdate: unknown}) {
  const status = (assetUpdate as {status?: unknown} | undefined)?.status
  if (status === 'created') {
    return (
      <RobotsNote tone="positive">
        The chapters were added to the Mux video as its chapters track.
      </RobotsNote>
    )
  }
  if (status === 'failed') {
    return (
      <RobotsNote tone="caution">
        Mux couldn’t add these chapters to the video. They’re still listed below.
      </RobotsNote>
    )
  }
  return (
    <RobotsNote>These chapters weren’t added to the Mux video; they’re listed below.</RobotsNote>
  )
}

const GENERATE_CHAPTERS: OutputView = {
  hasContent: (outputs) => asRows(outputs['chapters']).length > 0,
  render: (outputs) => (
    <Stack gap={3}>
      <ChaptersAssetUpdateNote assetUpdate={outputs['asset_update']} />
      <Stack gap={2}>
        {asRows(outputs['chapters']).map((chapter, index) => (
          // oxlint-disable-next-line react/no-array-index-key -- read-only output, never reorders
          <Text key={index} size={1}>
            {formatOffset(chapter['start_time'])} — {formatText(chapter['title'])}
          </Text>
        ))}
      </Stack>
    </Stack>
  ),
}

/** A moment's narratives: which one has content depends on transcript vs visual evidence. */
function Narratives({moment}: {moment: Outputs}) {
  const quotable = (moment['quotable_segment'] as {text?: unknown} | undefined)?.text
  const parts = [
    ['Heard', moment['audible_narrative']],
    ['Seen', moment['visual_narrative']],
    ['Quote', quotable],
  ].filter((part): part is [string, string] => typeof part[1] === 'string' && part[1].trim() !== '')
  if (parts.length === 0) return null
  return (
    <Stack gap={2}>
      {parts.map(([label, text]) => (
        <Text key={label} size={1}>
          <strong>{label}:</strong> {text}
        </Text>
      ))}
    </Stack>
  )
}

const FIND_KEY_MOMENTS: OutputView = {
  hasContent: (outputs) => asRows(outputs['moments']).length > 0,
  render: (outputs) => (
    <Stack gap={2}>
      {asRows(outputs['moments']).map((moment, index) => {
        const concepts = [
          ...asStrings(moment['notable_audible_concepts']),
          ...asRows(moment['notable_visual_concepts']).map((concept) =>
            String(concept['concept'] ?? ''),
          ),
        ].filter(Boolean)
        return (
          <RowCard
            // oxlint-disable-next-line react/no-array-index-key -- read-only output, never reorders
            key={index}
            title={formatText(moment['title'])}
            meta={`${formatOffsetMs(moment['start_ms'])} – ${formatOffsetMs(moment['end_ms'])} · score ${formatScore(moment['overall_score'])}`}
          >
            <Narratives moment={moment} />
            {concepts.length > 0 && <Tags tags={[...new Set(concepts)]} tone="primary" />}
          </RowCard>
        )
      })}
    </Stack>
  ),
}

const FIND_SCENES: OutputView = {
  hasContent: (outputs) => asRows(outputs['scenes']).length > 0,
  render: (outputs) => (
    <Stack gap={2}>
      {asRows(outputs['scenes']).map((scene, index) => (
        <RowCard
          // oxlint-disable-next-line react/no-array-index-key -- read-only output, never reorders
          key={index}
          title={formatText(scene['title'])}
          meta={`${formatOffsetMs(scene['start_ms'])} – ${formatOffsetMs(scene['end_ms'])}`}
        >
          <Text size={1}>
            {String(
              scene['blended_narrative'] ??
                scene['audible_narrative'] ??
                scene['visual_narrative'] ??
                EM_DASH,
            )}
          </Text>
        </RowCard>
      ))}
    </Stack>
  ),
}

const FIND_BEST_THUMBNAILS: OutputView = {
  hasContent: (outputs) => asRows(outputs['best_thumbnails']).length > 0,
  render: (outputs) => (
    <Stack gap={2}>
      {asRows(outputs['best_thumbnails']).map((thumbnail, index) => (
        <RowCard
          // oxlint-disable-next-line react/no-array-index-key -- read-only output, never reorders
          key={index}
          title={`At ${formatOffsetMs(thumbnail['timestamp_ms'])}`}
          meta={`Score ${formatScore(thumbnail['overall'])}`}
        >
          {typeof thumbnail['description'] === 'string' && (
            <Text size={1}>{thumbnail['description']}</Text>
          )}
        </RowCard>
      ))}
    </Stack>
  ),
}

const ENGAGEMENT_INSIGHTS: OutputView = {
  hasContent: (outputs) => {
    const overall = (outputs['overall_insight'] ?? {}) as Outputs
    return (
      typeof overall['summary'] === 'string' ||
      asStrings(overall['trends']).length > 0 ||
      asRows(outputs['moment_insights']).length > 0
    )
  },
  render: (outputs) => {
    const overall = (outputs['overall_insight'] ?? {}) as Outputs
    const moments = asRows(outputs['moment_insights'])
    return (
      <Stack gap={4}>
        {typeof overall['summary'] === 'string' && <Text size={1}>{overall['summary']}</Text>}
        {asStrings(overall['trends']).map((trend) => (
          <Text key={trend} size={1}>
            • {trend}
          </Text>
        ))}
        {moments.length > 0 && (
          <Labelled label="Moments">
            <RobotsJsonBlock value={moments} what="these moment insights" />
          </Labelled>
        )}
      </Stack>
    )
  },
}

/** The result is a track on the Mux video; the payload shows its ids and any temporary URLs. */
const TRACK_PRODUCING: OutputView = {
  hasContent: () => true,
  render: (outputs) => (
    <Stack gap={3}>
      <RobotsNote tone="positive">
        The generated track is on the Mux video. The Studio picks it up when the job finishes;
        resync the video if it hasn’t shown up yet.
      </RobotsNote>
      <RobotsJsonBlock value={outputs} what="this output" />
    </Stack>
  ),
}

export const OUTPUT_VIEWS: Record<RobotsWorkflow, OutputView> = {
  'summarize': SUMMARIZE,
  'moderate': MODERATE,
  'ask-questions': ASK_QUESTIONS,
  'generate-chapters': GENERATE_CHAPTERS,
  'find-key-moments': FIND_KEY_MOMENTS,
  'find-scenes': FIND_SCENES,
  'find-best-thumbnails': FIND_BEST_THUMBNAILS,
  'generate-engagement-insights': ENGAGEMENT_INSIGHTS,
  'generate-premium-captions': TRACK_PRODUCING,
  'edit-captions': TRACK_PRODUCING,
  'translate-captions': TRACK_PRODUCING,
  'translate-audio': TRACK_PRODUCING,
}
