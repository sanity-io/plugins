import {describe, expect, test} from 'vitest'

import {ROBOTS_CATALOG_BY_KEY} from './catalog'
import {ROBOTS_WORKFLOWS, type RobotsWorkflow} from './types'

/**
 * Every v1 job parameter path in the Mux API spec (checked 2026-10-30), per workflow, stopping at
 * arrays and taxonomy objects. When Mux adds a parameter, add it here: the gap then fails below
 * until the catalog offers it or it joins `LEFT_OUT`.
 */
const SPEC_PARAMETER_PATHS: Record<RobotsWorkflow, string[]> = {
  'generate-premium-captions': [
    'language_code',
    'replace_existing_tracks',
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
    'replace_existing_tracks',
    'track_name',
  ],
  'translate-captions': [
    'track_id',
    'track_name',
    'upload_to_mux',
    'never_translate',
    'replace_existing_tracks',
    'output_language_code',
  ],
  'translate-audio': [
    'track_name',
    'upload_to_mux',
    'replace_existing_tracks',
    'output_language_code',
  ],
  'summarize': [
    'tone',
    'output_steering.scope.start_time',
    'output_steering.scope.end_time',
    'output_steering.tag_taxonomy',
    'output_steering.summary_style',
    'output_steering.audience',
    'output_steering.brand_terms',
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
    'use_shots',
    'output_steering.scope.start_time',
    'output_steering.scope.end_time',
    'output_steering.selection_strategy',
    'output_steering.title_style',
    'output_steering.audience',
    'output_steering.brand_terms',
    'output_steering.topic_taxonomy',
    'output_steering.rubric_priorities',
    'target_duration.min',
    'target_duration.max',
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
    'update_asset_chapters',
  ],
  'analyze-structure': [
    'language_code',
    'output_language_code',
    'output_steering.scope.start_time',
    'output_steering.scope.end_time',
    'output_steering.audience',
    'output_steering.brand_terms',
    'output_steering.topic_taxonomy',
    'output_steering.granularity',
    'update_asset_meta',
    'update_asset_chapters',
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

/** Left out on purpose. */
const LEFT_OUT: Partial<Record<RobotsWorkflow, RegExp[]>> = {
  // One value, the default.
  'edit-captions': [/^auto_censor_profanity\.detection_method$/],
}

describe.each(ROBOTS_WORKFLOWS)('%s', (workflow) => {
  const specPaths = SPEC_PARAMETER_PATHS[workflow]
  const catalogPaths = ROBOTS_CATALOG_BY_KEY[workflow].params
    .filter((field) => !field.formOnly)
    .map((field) => field.name)

  test('offers every documented parameter, or leaves it out on purpose', () => {
    const leftOut = LEFT_OUT[workflow] ?? []
    const missing = specPaths.filter(
      (path) => !catalogPaths.includes(path) && !leftOut.some((pattern) => pattern.test(path)),
    )
    expect(missing).toEqual([])
  })

  test('offers nothing the spec does not document', () => {
    expect(catalogPaths.filter((path) => !specPaths.includes(path))).toEqual([])
  })
})
