import {describe, expect, test} from 'vitest'

import {ROBOTS_CATALOG_BY_KEY} from './catalog'
import {ROBOTS_WORKFLOWS, type RobotsWorkflow} from './types'

/**
 * Every job parameter path in the Mux API spec (checked 2026-09-29), per workflow, stopping at
 * arrays and taxonomy objects. When Mux adds a parameter, add it here: the gap then fails below
 * until the catalog offers it or it joins `LEFT_OUT`.
 */
const SPEC_PARAMETER_PATHS: Record<RobotsWorkflow, string[]> = {
  'generate-premium-captions': [
    'language_code',
    'replace_existing_tracks',
    'replace_existing',
    'track_name',
    'include_speakers',
    'include_words',
    'upload_to_mux',
    'phrases',
  ],
  'edit-captions': [
    'track_id',
    'auto_censor_profanity.detection_method',
    'auto_censor_profanity.mode',
    'auto_censor_profanity.always_censor',
    'auto_censor_profanity.never_censor',
    'replacements',
    'speaker_replacements',
    'upload_to_mux',
    'delete_original_track',
    'track_name_suffix',
  ],
  'translate-captions': [
    'track_id',
    'to_language_code',
    'upload_to_mux',
    'never_translate',
    'replace_existing_tracks',
  ],
  'translate-audio': ['to_language_code', 'upload_to_mux', 'replace_existing_tracks'],
  'summarize': [
    'tone',
    'output_steering.scope.start_time',
    'output_steering.scope.end_time',
    'output_steering.tag_taxonomy',
    'output_steering.summary_style',
    'output_steering.audience',
    'output_steering.brand_terms',
    'prompt_overrides.task',
    'prompt_overrides.title',
    'prompt_overrides.description',
    'prompt_overrides.keywords',
    'prompt_overrides.quality_guidelines',
    'title_length',
    'description_length',
    'tag_count',
    'language_code',
    'output_language_code',
    'update_asset_meta',
  ],
  'ask-questions': [
    'questions',
    'language_code',
    'max_free_form_answer_length',
    'output_steering.scope.start_time',
    'output_steering.scope.end_time',
  ],
  'find-key-moments': [
    'max_moments',
    'target_duration_ms.min',
    'target_duration_ms.max',
    'use_shots',
    'output_steering.scope.start_time',
    'output_steering.scope.end_time',
    'output_steering.selection_strategy',
    'output_steering.title_style',
    'output_steering.audience',
    'output_steering.brand_terms',
    'output_steering.topic_taxonomy',
    'output_steering.rubric_priorities',
  ],
  'find-best-thumbnails': [
    'max_thumbnails',
    'output_steering.scope.start_time',
    'output_steering.scope.end_time',
    'output_steering.selection_strategy',
    'output_steering.looking_for',
    'output_steering.audience',
    'output_steering.campaign_style',
    'output_steering.scoring_priorities',
    'update_asset_thumbnail',
  ],
  'generate-engagement-insights': [],
  'generate-chapters': [
    'language_code',
    'output_language_code',
    'output_steering.chapter_style',
    'output_steering.chapter_granularity',
    'output_steering.audience',
    'output_steering.brand_terms',
    'prompt_overrides.task',
    'prompt_overrides.output_format',
    'prompt_overrides.chapter_guidelines',
    'prompt_overrides.title_guidelines',
    'update_asset_chapters',
  ],
  'find-scenes': [
    'language_code',
    'min_scenes',
    'min_scene_duration_ms',
    'output_steering.scope.start_time',
    'output_steering.scope.end_time',
    'output_steering.segmentation_strategy',
    'output_steering.title_style',
    'output_steering.narration_detail',
    'output_steering.audience',
    'output_steering.brand_terms',
    'output_steering.topic_taxonomy',
  ],
  'moderate': [
    'language_code',
    'thresholds.sexual',
    'thresholds.violence',
    'sampling_interval',
    'max_samples',
    'output_steering.scope.start_time',
    'output_steering.scope.end_time',
    'on_flagged.action',
  ],
}

/** Deprecated, superseded or single-valued: left out on purpose. */
const LEFT_OUT = [
  /^replace_existing$/,
  /^prompt_overrides\./,
  /^auto_censor_profanity\.detection_method$/,
]

describe.each(ROBOTS_WORKFLOWS)('%s', (workflow) => {
  const specPaths = SPEC_PARAMETER_PATHS[workflow]
  const catalogPaths = ROBOTS_CATALOG_BY_KEY[workflow].params
    .filter((field) => !field.formOnly)
    .map((field) => field.name)

  test('offers every documented parameter, or leaves it out on purpose', () => {
    const missing = specPaths.filter(
      (path) => !catalogPaths.includes(path) && !LEFT_OUT.some((pattern) => pattern.test(path)),
    )
    expect(missing).toEqual([])
  })

  test('offers nothing the spec does not document', () => {
    expect(catalogPaths.filter((path) => !specPaths.includes(path))).toEqual([])
  })
})
