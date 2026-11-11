import {Badge, Card, Flex, Stack, Text} from '@sanity/ui'
import type {ReactElement, ReactNode} from 'react'

import {
  asRows,
  asStrings,
  EM_DASH,
  formatMediaSpan,
  formatMediaTime,
  formatOffset,
  formatScore,
  formatText,
} from '../../robots/format'
import type {RobotsJobWorkflow} from '../../robots/types'
import {RobotsJsonBlock} from './RobotsJsonBlock'
import {RobotsNote} from './RobotsNote'

type Outputs = Record<string, unknown>

interface OutputView {
  /** False for a payload this view can't draw, so the raw JSON shows instead of an empty view. */
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

/** v1 reports each asset update a job was asked for under `asset_updates`. */
function assetUpdates(outputs: Outputs): {
  title?: unknown
  chapters?: unknown
  thumbnail?: unknown
} {
  const updates = outputs['asset_updates']
  return updates && typeof updates === 'object' ? updates : {}
}

const TITLE_UPDATE = {
  done: 'The title was written to the Mux video. Resync the video to see it in the Studio.',
  failed: 'Mux couldn’t write the title to the video.',
}

const CHAPTERS_UPDATE = {
  done: 'The chapters were added to the Mux video as its chapters track.',
  failed: 'Mux couldn’t add these chapters to the video. They’re still listed below.',
}

const THUMBNAIL_UPDATE = {
  done: 'Mux set the best frame as the video’s thumbnail.',
  failed: 'Mux couldn’t set the video’s thumbnail, so the Studio kept its own.',
}

/** The outcome of an asset update, or `unreported` when the job reports none. */
function AssetUpdateNote({
  assetUpdate,
  done,
  failed,
  unreported = null,
}: {
  assetUpdate: unknown
  done: string
  failed: string
  unreported?: ReactElement | null
}) {
  const status = (assetUpdate as {status?: unknown} | undefined)?.status
  if (status === 'updated' || status === 'created') {
    return <RobotsNote tone="positive">{done}</RobotsNote>
  }
  if (status === 'failed') return <RobotsNote tone="caution">{failed}</RobotsNote>
  return unreported
}

/** Summarize calls the text `description`, Analyze structure `summary`. */
function hasSummary(outputs: Outputs, textKey: 'description' | 'summary'): boolean {
  return (
    typeof outputs['title'] === 'string' ||
    typeof outputs[textKey] === 'string' ||
    asStrings(outputs['tags']).length > 0
  )
}

function Summary({outputs, textKey}: {outputs: Outputs; textKey: 'description' | 'summary'}) {
  const text = outputs[textKey]
  const tags = asStrings(outputs['tags'])
  return (
    <>
      {typeof outputs['title'] === 'string' && (
        <Labelled label="Title">
          <Text size={1}>{outputs['title']}</Text>
        </Labelled>
      )}
      {typeof text === 'string' && (
        <Labelled label={textKey === 'summary' ? 'Summary' : 'Description'}>
          <Text size={1}>{text}</Text>
        </Labelled>
      )}
      {tags.length > 0 && (
        <Labelled label="Tags">
          <Tags tags={tags} />
        </Labelled>
      )}
    </>
  )
}

const SUMMARIZE: OutputView = {
  hasContent: (outputs) => hasSummary(outputs, 'description'),
  render: (outputs) => (
    <Stack gap={4}>
      <AssetUpdateNote assetUpdate={assetUpdates(outputs).title} {...TITLE_UPDATE} />
      <Summary outputs={outputs} textKey="description" />
    </Stack>
  ),
}

/** Skips a reader expects (no frames on audio-only, the transcript turned off) get no note. */
const MODERATED_SURFACES = [
  {
    key: 'thumbnail_moderation',
    expectedSkip: 'no_video_track',
    skipped: 'The frames weren’t moderated',
    failed: 'Mux couldn’t moderate the frames, so the scores come from what is said.',
  },
  {
    key: 'transcript_moderation',
    expectedSkip: 'disabled',
    skipped: 'What is said wasn’t moderated',
    failed: 'Mux couldn’t moderate what is said, so the scores come from the frames.',
  },
]

/** v1 reports what each surface moderated; v0 reports neither. */
function ModeratedSurfaceNotes({outputs}: {outputs: Outputs}) {
  return MODERATED_SURFACES.map(({key, expectedSkip, skipped, failed}) => {
    const surface = (outputs[key] ?? {}) as {
      status?: unknown
      skip_reason?: unknown
      skip_message?: unknown
    }
    if (surface.status === 'failed') {
      return (
        <RobotsNote key={key} tone="caution">
          {failed}
        </RobotsNote>
      )
    }
    if (surface.status !== 'skipped' || surface.skip_reason === expectedSkip) return null
    return (
      <RobotsNote key={key}>
        {typeof surface.skip_message === 'string'
          ? `${skipped}: ${surface.skip_message}`
          : `${skipped}.`}
      </RobotsNote>
    )
  })
}

const MODERATE: OutputView = {
  hasContent: (outputs) =>
    typeof outputs['exceeds_threshold'] === 'boolean' ||
    Object.keys(outputs['max_scores'] ?? {}).length > 0,
  render: (outputs) => (
    <Stack gap={3}>
      <ModeratedSurfaceNotes outputs={outputs} />
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

/**
 * Present only when the job ran with `update_asset_chapters`: v1 reports it in
 * `asset_updates.chapters`, v0 in `asset_update`.
 */
function chaptersAssetUpdate(outputs: Outputs): unknown {
  return assetUpdates(outputs).chapters ?? outputs['asset_update']
}

function Chapters({chapters}: {chapters: Outputs[]}) {
  return (
    <Stack gap={2}>
      {chapters.map((chapter, index) => (
        // oxlint-disable-next-line react/no-array-index-key -- read-only output, never reorders
        <Text key={index} size={1}>
          {formatOffset(chapter['start_time'])} — {formatText(chapter['title'])}
        </Text>
      ))}
    </Stack>
  )
}

const GENERATE_CHAPTERS: OutputView = {
  hasContent: (outputs) => asRows(outputs['chapters']).length > 0,
  render: (outputs) => (
    <Stack gap={3}>
      <AssetUpdateNote
        assetUpdate={chaptersAssetUpdate(outputs)}
        {...CHAPTERS_UPDATE}
        unreported={
          <RobotsNote>
            These chapters weren’t added to the Mux video; they’re listed below.
          </RobotsNote>
        }
      />
      <Chapters chapters={asRows(outputs['chapters'])} />
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

/** Find key moments calls them `moments`, Analyze structure `key_moments`. */
function KeyMoments({moments}: {moments: Outputs[]}) {
  return (
    <Stack gap={2}>
      {moments.map((moment, index) => {
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
            meta={`${formatMediaSpan(moment)} · score ${formatScore(moment['overall_score'])}`}
          >
            <Narratives moment={moment} />
            {concepts.length > 0 && <Tags tags={[...new Set(concepts)]} tone="primary" />}
          </RowCard>
        )
      })}
    </Stack>
  )
}

const FIND_KEY_MOMENTS: OutputView = {
  hasContent: (outputs) => asRows(outputs['moments']).length > 0,
  render: (outputs) => <KeyMoments moments={asRows(outputs['moments'])} />,
}

function Scenes({scenes}: {scenes: Outputs[]}) {
  return (
    <Stack gap={2}>
      {scenes.map((scene, index) => (
        <RowCard
          // oxlint-disable-next-line react/no-array-index-key -- read-only output, never reorders
          key={index}
          title={formatText(scene['title'])}
          meta={formatMediaSpan(scene)}
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
  )
}

/** v0 only: its jobs still show until Mux deletes them. */
const FIND_SCENES: OutputView = {
  hasContent: (outputs) => asRows(outputs['scenes']).length > 0,
  render: (outputs) => <Scenes scenes={asRows(outputs['scenes'])} />,
}

const STRUCTURE_LISTS = ['chapters', 'scenes', 'key_moments']

/** Mux always returns the lists; what the document kept of a deleted job has none of them. */
const ANALYZE_STRUCTURE: OutputView = {
  hasContent: (outputs) =>
    hasSummary(outputs, 'summary') || STRUCTURE_LISTS.some((key) => Array.isArray(outputs[key])),
  render: (outputs) => {
    const updates = assetUpdates(outputs)
    const chapters = asRows(outputs['chapters'])
    const scenes = asRows(outputs['scenes'])
    const moments = asRows(outputs['key_moments'])
    return (
      <Stack gap={4}>
        <AssetUpdateNote assetUpdate={updates.title} {...TITLE_UPDATE} />
        <AssetUpdateNote assetUpdate={updates.chapters} {...CHAPTERS_UPDATE} />
        <Summary outputs={outputs} textKey="summary" />
        {Array.isArray(outputs['chapters']) && (
          <Labelled label="Chapters">
            {chapters.length > 0 ? (
              <Chapters chapters={chapters} />
            ) : (
              <Text size={1} muted>
                Mux made none. Chapters need at least a minute of the video.
              </Text>
            )}
          </Labelled>
        )}
        {Array.isArray(outputs['scenes']) && (
          <Labelled label="Scenes">
            {scenes.length > 0 ? (
              <Scenes scenes={scenes} />
            ) : (
              <Text size={1} muted>
                Mux found none. An audio-only video never has scenes.
              </Text>
            )}
          </Labelled>
        )}
        {Array.isArray(outputs['key_moments']) && (
          <Labelled label="Key moments">
            {moments.length > 0 ? (
              <KeyMoments moments={moments} />
            ) : (
              <Text size={1} muted>
                None qualified.
              </Text>
            )}
          </Labelled>
        )}
      </Stack>
    )
  },
}

const FIND_BEST_THUMBNAILS: OutputView = {
  hasContent: (outputs) => asRows(outputs['best_thumbnails']).length > 0,
  render: (outputs) => (
    <Stack gap={3}>
      <AssetUpdateNote assetUpdate={assetUpdates(outputs).thumbnail} {...THUMBNAIL_UPDATE} />
      <Stack gap={2}>
        {asRows(outputs['best_thumbnails']).map((thumbnail, index) => (
          <RowCard
            // oxlint-disable-next-line react/no-array-index-key -- read-only output, never reorders
            key={index}
            title={`At ${formatMediaTime(thumbnail['time'], thumbnail['timestamp_ms'])}`}
            meta={`Score ${formatScore(thumbnail['overall'])}`}
          >
            {typeof thumbnail['description'] === 'string' && (
              <Text size={1}>{thumbnail['description']}</Text>
            )}
          </RowCard>
        ))}
      </Stack>
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

export const OUTPUT_VIEWS: Record<RobotsJobWorkflow, OutputView> = {
  'summarize': SUMMARIZE,
  'moderate': MODERATE,
  'ask-questions': ASK_QUESTIONS,
  'generate-chapters': GENERATE_CHAPTERS,
  'find-key-moments': FIND_KEY_MOMENTS,
  'analyze-structure': ANALYZE_STRUCTURE,
  'find-scenes': FIND_SCENES,
  'find-best-thumbnails': FIND_BEST_THUMBNAILS,
  'generate-engagement-insights': ENGAGEMENT_INSIGHTS,
  'generate-premium-captions': TRACK_PRODUCING,
  'edit-captions': TRACK_PRODUCING,
  'translate-captions': TRACK_PRODUCING,
  'translate-audio': TRACK_PRODUCING,
}
