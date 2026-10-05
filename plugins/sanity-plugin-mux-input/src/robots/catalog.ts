import type {RobotsWorkflow} from './types'

/**
 * The twelve Robots workflows as data: one descriptor per parameter, so the run dialog renders
 * itself and this file alone decides what reaches Mux. Every name, nesting level, enum member
 * and limit is checked against the API spec; where the reference and a guide disagree, the
 * stricter figure wins. Left out on purpose: the deprecated `replace_existing` and
 * `prompt_overrides`, and `auto_censor_profanity.detection_method` (one value, the default).
 *
 * `name` is a dotted path into `parameters` (`thresholds.sexual`); `buildRobotsParameters`
 * expands it back into the nested object.
 */

export type RobotsParamKind =
  | 'text'
  | 'number'
  | 'boolean'
  | 'select'
  | 'language'
  /** Picks one of the asset's caption tracks. */
  | 'track'
  | 'stringList'
  /** Multi-select over a fixed enum, never free text. */
  | 'enumList'
  | 'questions'
  | 'replacements'
  | 'speakerReplacements'
  /** A controlled vocabulary: `topic_taxonomy` / `tag_taxonomy`. */
  | 'taxonomy'

export interface RobotsParamOption {
  value: string
  label: string
}

/**
 * What's known about the Mux asset. Unknown stays `undefined`, and every rule reads an explicit
 * `true` / `false`, so missing information never blocks a run.
 */
export interface RobotsAssetContext {
  hasCaptions?: boolean
  isAudioOnly?: boolean
  /** Seconds. Absent for live streams. */
  duration?: number
}

/** When a field is shown, and therefore sent. */
export type RobotsFieldCondition =
  | {field: string; equals: unknown}
  | {context: keyof RobotsAssetContext; notEquals: unknown}

/** Documented caps on a controlled vocabulary. An absent limit means the spec states none. */
export interface RobotsTaxonomyLimits {
  maxValues?: number
  maxNameLength?: number
  maxLabelLength?: number
  maxDescriptionLength?: number
  maxAliases?: number
  maxAliasLength?: number
  /** Measured over the JSON actually sent. */
  maxSerializedLength?: number
}

/** A warning the confirm step shows when a destructive value is chosen. */
export interface RobotsConfirmWarning {
  whenValue: string
  title: string
  body: string
}

/** A titled group of consecutive fields. Presentation only. */
export interface RobotsParamSection {
  id: string
  title: string
  description?: string
}

export interface RobotsParamField {
  kind: RobotsParamKind
  /** Dotted path within the job's `parameters`. */
  name: string
  label: string
  helpText?: string
  section?: RobotsParamSection
  isRequired?: boolean
  placeholder?: string
  /** `select` and `enumList`. */
  options?: RobotsParamOption[]
  /** `number`. */
  min?: number
  max?: number
  step?: number
  /** `number`: the spec types it as an integer. */
  integer?: boolean
  /** `text`. */
  maxLength?: number
  /** `stringList`, `enumList` and `questions`. */
  maxItems?: number
  /** `stringList`. */
  maxItemLength?: number
  /** `taxonomy`. */
  taxonomyLimits?: RobotsTaxonomyLimits
  /** The form's starting value. `''` means untouched and is never sent. */
  defaultValue?: string | number | boolean
  /** Render, and send, only while this holds. */
  showWhen?: RobotsFieldCondition
  /** Shapes the form but is never sent. */
  formOnly?: boolean
  /** `boolean`: sent only when on, since Mux reads absent as off. */
  omitWhenFalse?: boolean
  confirmWarnings?: RobotsConfirmWarning[]
}

export type RobotsCategory = 'Accessibility' | 'Insights' | 'Structure' | 'Trust & Safety'

export interface RobotsWorkflowDefinition {
  key: RobotsWorkflow
  label: string
  category: RobotsCategory
  description: string
  params: RobotsParamField[]
  /** Shown on the form and again at the confirm step. */
  notes?: string[]
  requiresViewData?: boolean
  producesTrack?: boolean
  planRestricted?: boolean
  /** Offered disabled on a known audio-only asset. */
  requiresVideoTrack?: boolean
}

const LANGUAGE_HELP = 'BCP 47 language code, e.g. en, es, ja.'

/** Every `language_code` that picks which caption track a workflow reads. */
const CAPTIONS_TO_READ_LABEL = 'Captions to read'

/** A select's `''` option: leaves the parameter out. Never "Default", which claims Mux has one. */
const NO_PREFERENCE_LABEL = 'No preference'

const SCOPE_SECTION: RobotsParamSection = {
  id: 'scope',
  title: 'Part of the video',
  description:
    'Seconds from the start of the video. Leave both empty to use all of it; timestamps in the ' +
    'result are still measured from the start.',
}

const SCOPE_FIELDS: RobotsParamField[] = [
  {
    kind: 'number',
    name: 'output_steering.scope.start_time',
    label: 'Start time (seconds)',
    min: 0,
    step: 1,
    section: SCOPE_SECTION,
  },
  {
    kind: 'number',
    name: 'output_steering.scope.end_time',
    label: 'End time (seconds)',
    min: 0,
    step: 1,
    section: SCOPE_SECTION,
  },
]

const TAGS_SECTION: RobotsParamSection = {id: 'tags', title: 'Tags'}

const HIGHLIGHT_LENGTH_SECTION: RobotsParamSection = {
  id: 'highlight-length',
  title: 'Highlight length',
  description: 'Set both bounds, or neither.',
}

const UPLOAD_TO_MUX: RobotsParamField = {
  kind: 'boolean',
  name: 'upload_to_mux',
  label: 'Attach the result to the Mux asset',
  helpText: 'Leave on to get a real track on the asset. Off returns a temporary download URL only.',
  defaultValue: true,
}

const AUDIENCE_MAX_LENGTH = 160

function audienceField(placeholder?: string): RobotsParamField {
  return {
    kind: 'text',
    name: 'output_steering.audience',
    label: 'Audience',
    maxLength: AUDIENCE_MAX_LENGTH,
    ...(placeholder && {placeholder}),
  }
}

function brandTermsField(helpText: string): RobotsParamField {
  return {
    kind: 'stringList',
    name: 'output_steering.brand_terms',
    label: 'Brand terms',
    helpText: `${helpText} Up to 10 terms, each at most 40 characters.`,
    maxItems: 10,
    maxItemLength: 40,
  }
}

/** `topic_taxonomy` has the same caps as `tag_taxonomy`, except the 2000-character total. */
const TOPIC_TAXONOMY: RobotsParamField = {
  kind: 'taxonomy',
  name: 'output_steering.topic_taxonomy',
  label: 'Topic taxonomy',
  helpText:
    'A controlled vocabulary to steer the topics this workflow names. Up to 50 values. Leave it ' +
    'empty to let the model choose its own.',
  taxonomyLimits: {
    maxValues: 50,
    maxNameLength: 100,
    maxLabelLength: 100,
    maxDescriptionLength: 300,
    maxAliases: 10,
    maxAliasLength: 100,
  },
}

/** `replace_existing_tracks`, which replaces the deprecated `replace_existing`. */
function replaceExistingTracksField(track: 'caption' | 'audio'): RobotsParamField {
  const noun = track === 'audio' ? 'audio track' : 'caption track'
  const warning = (whenValue: string, which: string): RobotsConfirmWarning => ({
    whenValue,
    title: 'This run deletes existing tracks',
    body:
      `Any ${which}${noun} on this video in the same language, or with the same name, is ` +
      'deleted before the new one is added. Players lose that track until the job finishes.',
  })
  const options: RobotsParamOption[] = [
    {value: 'fail', label: 'Stop and don’t run'},
    {value: 'replace_all', label: 'Replace every matching track'},
  ]
  const confirmWarnings = [warning('replace_all', '')]
  // Mux never auto-generates audio, so `replace_generated` would behave as `fail` there.
  if (track === 'caption') {
    options.push({value: 'replace_generated', label: 'Replace only auto-generated tracks'})
    confirmWarnings.push(warning('replace_generated', 'auto-generated '))
  }
  return {
    kind: 'select',
    name: 'replace_existing_tracks',
    label: `If ${track === 'audio' ? 'an audio' : 'a'} track in this language already exists`,
    helpText:
      'Tracks match by language, ignoring region, or by name, ignoring case.' +
      (track === 'audio' ? ' The primary audio track is never deleted.' : ''),
    options,
    defaultValue: 'fail',
    showWhen: {field: 'upload_to_mux', equals: true},
    confirmWarnings,
  }
}

export const ROBOTS_CATALOG: RobotsWorkflowDefinition[] = [
  {
    key: 'generate-premium-captions',
    label: 'Generate premium captions',
    category: 'Accessibility',
    description: "High-accuracy captions from the video's audio, optionally with speaker labels.",
    producesTrack: true,
    params: [
      {
        kind: 'language',
        name: 'language_code',
        label: 'Spoken language',
        helpText: `Leave empty to auto-detect. ${LANGUAGE_HELP}`,
      },
      {
        kind: 'text',
        name: 'track_name',
        label: 'Track name',
        helpText:
          'Leave empty and Mux names the track after its language — "English (Generated)" for ' +
          'English audio.',
      },
      {kind: 'boolean', name: 'include_speakers', label: 'Label speakers', defaultValue: false},
      {
        kind: 'boolean',
        name: 'include_words',
        label: 'Include word-level timings',
        helpText:
          'Billed at a higher unit rate. The words file (temporary_words_url) expires 7 days ' +
          'after the job.',
        defaultValue: false,
      },
      {
        // The spec allows 1000 phrases, the guide 100: the stricter figure wins.
        kind: 'stringList',
        name: 'phrases',
        label: 'Phrase hints',
        helpText:
          'Names, jargon or product terms to spell correctly. Up to 100 phrases, each at most ' +
          '5 words and 49 characters.',
        maxItems: 100,
        maxItemLength: 49,
      },
      UPLOAD_TO_MUX,
      replaceExistingTracksField('caption'),
    ],
  },
  {
    key: 'edit-captions',
    label: 'Edit captions',
    category: 'Accessibility',
    description: 'Apply find/replace rules and profanity filtering to an existing caption track.',
    producesTrack: true,
    params: [
      {kind: 'track', name: 'track_id', label: 'Caption track to edit', isRequired: true},
      {
        kind: 'replacements',
        name: 'replacements',
        label: 'Replacements',
        helpText: 'Static find/replace rules applied to the cue text.',
      },
      {
        // Form-only: off sends no `auto_censor_profanity`, on sends it with a documented mode.
        kind: 'boolean',
        name: 'censor_profanity',
        label: 'Censor profanity',
        helpText: 'Off leaves the words as they are. Replacements still apply either way.',
        defaultValue: false,
        formOnly: true,
      },
      {
        kind: 'select',
        name: 'auto_censor_profanity.mode',
        label: 'How to censor',
        helpText:
          'Blank out writes bracketed underscores, remove drops the text, mask writes question marks.',
        options: [
          {value: 'blank', label: 'Blank out'},
          {value: 'remove', label: 'Remove'},
          {value: 'mask', label: 'Mask'},
        ],
        defaultValue: 'blank',
        showWhen: {field: 'censor_profanity', equals: true},
      },
      {
        kind: 'stringList',
        name: 'auto_censor_profanity.always_censor',
        label: 'Always censor',
        helpText:
          'Words or phrases censored whatever the model decides. One per line; spaces are fine.',
        showWhen: {field: 'censor_profanity', equals: true},
      },
      {
        kind: 'stringList',
        name: 'auto_censor_profanity.never_censor',
        label: 'Never censor',
        helpText: 'Words or phrases left alone. One per line; spaces are fine.',
        showWhen: {field: 'censor_profanity', equals: true},
      },
      {
        kind: 'speakerReplacements',
        name: 'speaker_replacements',
        label: 'Speaker labels',
        helpText:
          'Renames the bracketed speaker labels at the start of cues. Write the labels without ' +
          'the brackets. The spoken text is not changed.',
      },
      {
        kind: 'text',
        name: 'track_name_suffix',
        label: 'Suffix for the new track name',
        helpText: 'Added to the original track’s name. Leave empty for Mux’s default, "edited".',
      },
      UPLOAD_TO_MUX,
      {
        kind: 'boolean',
        name: 'delete_original_track',
        label: 'Delete the original track',
        helpText: 'The edited track replaces it rather than sitting alongside it.',
        defaultValue: true,
        showWhen: {field: 'upload_to_mux', equals: true},
      },
    ],
  },
  {
    key: 'translate-captions',
    label: 'Translate captions',
    category: 'Accessibility',
    description: 'Translate an existing caption track into another language.',
    producesTrack: true,
    params: [
      {kind: 'track', name: 'track_id', label: 'Source caption track', isRequired: true},
      {
        kind: 'language',
        name: 'to_language_code',
        label: 'Target language',
        helpText: LANGUAGE_HELP,
        isRequired: true,
      },
      {
        kind: 'stringList',
        name: 'never_translate',
        label: 'Never translate',
        helpText:
          'Terms kept verbatim — brand names, product names, proper nouns. One per line, up to ' +
          '100 terms of at most 100 characters. Cannot contain < or >.',
        maxItems: 100,
        maxItemLength: 100,
      },
      UPLOAD_TO_MUX,
      replaceExistingTracksField('caption'),
    ],
  },
  {
    key: 'translate-audio',
    label: 'Translate audio (dub)',
    category: 'Accessibility',
    description: "Translate the video's spoken audio into another language as a new audio track.",
    producesTrack: true,
    planRestricted: true,
    notes: [
      'The run is rejected if the video has no audio track, or already has an audio track in ' +
        'the target language, unless you choose to replace it.',
      'Dubbing may not be enabled on every account.',
    ],
    params: [
      {
        kind: 'language',
        name: 'to_language_code',
        label: 'Target language',
        helpText: LANGUAGE_HELP,
        isRequired: true,
      },
      UPLOAD_TO_MUX,
      replaceExistingTracksField('audio'),
    ],
  },
  {
    key: 'summarize',
    label: 'Summarize',
    category: 'Insights',
    description: 'Generate a title, description and tags for the video.',
    params: [
      {
        kind: 'select',
        name: 'tone',
        label: 'Tone',
        options: [
          {value: '', label: NO_PREFERENCE_LABEL},
          {value: 'neutral', label: 'Neutral'},
          {value: 'playful', label: 'Playful'},
          {value: 'professional', label: 'Professional'},
        ],
        defaultValue: '',
      },
      {
        kind: 'number',
        name: 'title_length',
        label: 'Max title length (words)',
        min: 1,
        step: 1,
        integer: true,
      },
      {
        kind: 'number',
        name: 'description_length',
        label: 'Max description length (words)',
        min: 1,
        step: 1,
        integer: true,
      },
      {
        kind: 'language',
        name: 'language_code',
        label: CAPTIONS_TO_READ_LABEL,
        helpText:
          'Summarize reads one of this video’s caption tracks. Choose the language of the one ' +
          'to use, or leave empty and Mux picks. The summary’s own language is Output language.',
      },
      {
        kind: 'language',
        name: 'output_language_code',
        label: 'Output language',
        helpText: `Leave empty to write in the captions’ language. ${LANGUAGE_HELP}`,
      },
      audienceField('Product marketers'),
      brandTermsField('Terminology to prefer in the generated copy.'),
      {
        kind: 'number',
        name: 'tag_count',
        label: 'Number of tags',
        helpText: 'Defaults to 10.',
        min: 1,
        step: 1,
        integer: true,
        section: TAGS_SECTION,
      },
      {
        kind: 'taxonomy',
        name: 'output_steering.tag_taxonomy',
        label: 'Tag taxonomy',
        helpText:
          'A controlled vocabulary for the generated tags. Up to 50 values, and 2000 characters ' +
          'across the whole taxonomy. Leave it empty to let the model choose its own tags.',
        section: TAGS_SECTION,
        taxonomyLimits: {
          maxValues: 50,
          maxNameLength: 100,
          maxLabelLength: 100,
          maxDescriptionLength: 300,
          maxAliases: 10,
          maxAliasLength: 100,
          maxSerializedLength: 2000,
        },
      },
      {
        kind: 'select',
        name: 'output_steering.summary_style',
        label: 'Summary style',
        options: [
          {value: '', label: NO_PREFERENCE_LABEL},
          {value: 'concise', label: 'Concise'},
          {value: 'detailed', label: 'Detailed'},
          {value: 'editorial', label: 'Editorial'},
        ],
        defaultValue: '',
      },
      ...SCOPE_FIELDS,
      {
        kind: 'boolean',
        name: 'update_asset_meta',
        label: "Set the asset's title to the generated one",
        helpText:
          'Writes meta.title on the Mux asset. The title in the Studio only changes when you ' +
          'resync the video.',
        defaultValue: false,
      },
    ],
  },
  {
    key: 'ask-questions',
    label: 'Ask questions',
    category: 'Insights',
    description: 'Ask questions about the video and get structured answers.',
    params: [
      {
        kind: 'questions',
        name: 'questions',
        label: 'Questions',
        helpText:
          'Up to 50 questions, at most 600 characters each. Pick how each one is answered: from ' +
          'a list of options (empty means yes / no, and each option can be up to 150 ' +
          'characters), or in the model’s own words.',
        isRequired: true,
        maxItems: 50,
      },
      {
        kind: 'number',
        name: 'max_free_form_answer_length',
        label: 'Maximum length of a written answer',
        helpText:
          'Characters, 1–1000. Defaults to 500. Ignored unless a question above is set to ' +
          '“In its own words”.',
        min: 1,
        max: 1000,
        step: 1,
        integer: true,
      },
      {
        kind: 'language',
        name: 'language_code',
        label: CAPTIONS_TO_READ_LABEL,
        helpText:
          'The answers come from one of this video’s caption tracks. Choose the language of ' +
          'the one to use, or leave empty and Mux picks.',
      },
      ...SCOPE_FIELDS,
    ],
  },
  {
    key: 'find-key-moments',
    label: 'Find key moments',
    category: 'Insights',
    description: 'Identify the most compelling moments, scored and titled.',
    params: [
      {
        kind: 'boolean',
        name: 'use_shots',
        label: 'Use visual evidence (Mux Shots)',
        helpText:
          'Off, the video needs a caption track: selection reads the transcript. On, selection ' +
          'reads the picture instead and no captions are needed — at the cost of generating ' +
          'or reusing Mux Shots, billed separately from Robots units. Not supported on ' +
          'audio-only videos, which always read the transcript.',
        defaultValue: false,
      },
      {
        kind: 'number',
        name: 'max_moments',
        label: 'Maximum moments',
        helpText: '1–25. Defaults to 10, or 25 for videos over an hour.',
        min: 1,
        max: 25,
        step: 1,
        integer: true,
      },
      {
        kind: 'number',
        name: 'target_duration_ms.min',
        label: 'Minimum highlight length (ms)',
        min: 0,
        step: 1000,
        integer: true,
        section: HIGHLIGHT_LENGTH_SECTION,
      },
      {
        kind: 'number',
        name: 'target_duration_ms.max',
        label: 'Maximum highlight length (ms)',
        min: 0,
        step: 1000,
        integer: true,
        section: HIGHLIGHT_LENGTH_SECTION,
      },
      {
        kind: 'select',
        name: 'output_steering.selection_strategy',
        label: 'What to look for',
        options: [
          {value: '', label: NO_PREFERENCE_LABEL},
          {value: 'standalone_hooks', label: 'Standalone hooks'},
          {value: 'educational_takeaways', label: 'Educational takeaways'},
          {value: 'story_beats', label: 'Story beats'},
          {value: 'product_moments', label: 'Product moments'},
          {value: 'speaker_highlights', label: 'Speaker highlights'},
        ],
      },
      {
        kind: 'select',
        name: 'output_steering.title_style',
        label: 'Title style',
        options: [
          {value: '', label: NO_PREFERENCE_LABEL},
          {value: 'descriptive', label: 'Descriptive'},
          {value: 'punchy', label: 'Punchy'},
          {value: 'educational', label: 'Educational'},
          {value: 'social', label: 'Social'},
        ],
      },
      {
        kind: 'enumList',
        name: 'output_steering.rubric_priorities',
        label: 'Tie-breakers',
        helpText: 'Used to choose between moments the strategy above rates equally. Best effort.',
        maxItems: 4,
        options: [
          {value: 'clarity_in_isolation', label: 'Clarity in isolation'},
          {value: 'emotional_intensity', label: 'Emotional intensity'},
          {value: 'novelty', label: 'Novelty'},
          {value: 'soundbite_quality', label: 'Soundbite quality'},
        ],
      },
      audienceField(),
      brandTermsField('Terminology to prefer in the generated titles. One per line.'),
      TOPIC_TAXONOMY,
      ...SCOPE_FIELDS,
    ],
  },
  {
    key: 'find-best-thumbnails',
    label: 'Find best thumbnails',
    category: 'Insights',
    description: 'Sample and rank frames to pick the strongest thumbnail.',
    // A product decision: an audio-only asset has no frames to rank.
    requiresVideoTrack: true,
    params: [
      {
        kind: 'number',
        name: 'max_thumbnails',
        label: 'Maximum candidates',
        helpText: '1–5. Defaults to 1.',
        min: 1,
        max: 5,
        step: 1,
        integer: true,
      },
      {
        kind: 'boolean',
        name: 'update_asset_thumbnail',
        label: "Set the asset's thumbnail to the winner",
        helpText:
          'Writes thumbnail_time on the Mux asset, and the Studio uses it as this video’s ' +
          'thumbnail when the job finishes. Caches may take a while to catch up.',
        defaultValue: false,
      },
      {
        kind: 'select',
        name: 'output_steering.selection_strategy',
        label: 'What makes a good frame here',
        options: [
          {value: '', label: NO_PREFERENCE_LABEL},
          {value: 'face_or_action', label: 'Face or action'},
          {value: 'clean_composition', label: 'Clean composition'},
          {value: 'high_contrast', label: 'High contrast'},
          {value: 'brand_safe', label: 'Brand safe'},
          {value: 'campaign_thumbnail', label: 'Campaign thumbnail'},
        ],
      },
      {
        kind: 'enumList',
        name: 'output_steering.scoring_priorities',
        label: 'Scoring priorities',
        helpText: 'What to weigh when two frames score alike. Best effort.',
        options: [
          {value: 'focus', label: 'Focus'},
          {value: 'face_or_action', label: 'Face or action'},
          {value: 'composition', label: 'Composition'},
          {value: 'contrast_color', label: 'Contrast and colour'},
          {value: 'brand_fit', label: 'Brand fit'},
        ],
      },
      {
        kind: 'text',
        name: 'output_steering.looking_for',
        label: 'Looking for',
        placeholder: 'The presenter holding the product',
        maxLength: AUDIENCE_MAX_LENGTH,
      },
      audienceField(),
      {
        kind: 'text',
        name: 'output_steering.campaign_style',
        label: 'Campaign style',
        maxLength: AUDIENCE_MAX_LENGTH,
      },
      ...SCOPE_FIELDS,
    ],
  },
  {
    key: 'generate-engagement-insights',
    label: 'Generate engagement insights',
    category: 'Insights',
    description: 'Turn accumulated viewing data into per-moment engagement insights.',
    requiresViewData: true,
    notes: [
      'Needs Mux Data views on this asset. With no views recorded there is nothing to analyse.',
    ],
    params: [],
  },
  {
    key: 'generate-chapters',
    label: 'Generate chapters',
    category: 'Structure',
    description: 'Create timestamped chapters from the video content.',
    params: [
      {
        kind: 'language',
        name: 'language_code',
        label: CAPTIONS_TO_READ_LABEL,
        helpText:
          'Chapters are made from one of this video’s caption tracks. Choose the language of ' +
          'the one to use, or leave empty and Mux prefers English when there is an English ' +
          'track. The chapter titles’ language is Output language.',
      },
      {
        kind: 'language',
        name: 'output_language_code',
        label: 'Output language',
        helpText: `Leave empty to write in the captions’ language. ${LANGUAGE_HELP}`,
      },
      {
        kind: 'select',
        name: 'output_steering.chapter_style',
        label: 'Chapter style',
        options: [
          {value: '', label: NO_PREFERENCE_LABEL},
          {value: 'descriptive', label: 'Descriptive'},
          {value: 'punchy', label: 'Punchy'},
          {value: 'educational', label: 'Educational'},
          {value: 'seo', label: 'SEO'},
          {value: 'platform_neutral', label: 'Platform neutral'},
        ],
        defaultValue: '',
      },
      {
        kind: 'select',
        name: 'output_steering.chapter_granularity',
        label: 'Granularity',
        options: [
          {value: '', label: NO_PREFERENCE_LABEL},
          {value: 'coarse', label: 'Coarse'},
          {value: 'balanced', label: 'Balanced'},
          {value: 'fine', label: 'Fine'},
        ],
        defaultValue: '',
      },
      audienceField(),
      brandTermsField('Terminology to prefer in the chapter titles.'),
      {
        kind: 'boolean',
        name: 'update_asset_chapters',
        label: 'Add the chapters to the Mux video',
        helpText:
          'Writes them as the video’s chapters track when the job finishes. Replaces any ' +
          'chapters track the video already has, including one added by hand.',
        defaultValue: true,
        omitWhenFalse: true,
      },
    ],
  },
  {
    key: 'find-scenes',
    label: 'Find scenes',
    category: 'Structure',
    description: 'Segment the video into ordered, timestamped scenes.',
    requiresVideoTrack: true,
    params: [
      {
        kind: 'language',
        name: 'language_code',
        label: CAPTIONS_TO_READ_LABEL,
        helpText:
          'Scenes are found from this video’s caption track in that language, if it has one. ' +
          'Leave empty to use the first caption track that is ready.',
      },
      {
        kind: 'number',
        name: 'min_scenes',
        label: 'Minimum scenes (hint)',
        min: 1,
        step: 1,
        integer: true,
      },
      {
        kind: 'select',
        name: 'output_steering.segmentation_strategy',
        label: 'How to split the video',
        options: [
          {value: '', label: NO_PREFERENCE_LABEL},
          {value: 'editorial_beats', label: 'Editorial beats'},
          {value: 'topic_changes', label: 'Topic changes'},
          {value: 'visual_transitions', label: 'Visual transitions'},
          {value: 'action_progression', label: 'Action progression'},
          {value: 'instructional_steps', label: 'Instructional steps'},
        ],
      },
      {
        kind: 'select',
        name: 'output_steering.title_style',
        label: 'Title style',
        options: [
          {value: '', label: NO_PREFERENCE_LABEL},
          {value: 'descriptive', label: 'Descriptive'},
          {value: 'editorial', label: 'Editorial'},
          {value: 'search_optimized', label: 'Search optimized'},
          {value: 'accessibility', label: 'Accessibility'},
        ],
      },
      {
        kind: 'select',
        name: 'output_steering.narration_detail',
        label: 'Narration detail',
        options: [
          {value: '', label: NO_PREFERENCE_LABEL},
          {value: 'concise', label: 'Concise'},
          {value: 'balanced', label: 'Balanced'},
          {value: 'detailed', label: 'Detailed'},
        ],
      },
      audienceField(),
      brandTermsField('Terminology to prefer in the scene titles. One per line.'),
      TOPIC_TAXONOMY,
      ...SCOPE_FIELDS,
      {
        kind: 'number',
        name: 'min_scene_duration_ms',
        label: 'Minimum scene length (ms)',
        helpText: 'At least 1000. Defaults to 15000.',
        min: 1000,
        step: 1000,
        integer: true,
      },
    ],
  },
  {
    key: 'moderate',
    label: 'Moderate',
    category: 'Trust & Safety',
    description: 'Score sampled frames for sexual and violent content.',
    params: [
      {
        // Mux ignores it for video assets, so it's hidden once the asset is known to have video.
        kind: 'language',
        name: 'language_code',
        label: CAPTIONS_TO_READ_LABEL,
        helpText:
          'Only for an audio-only video, which is moderated from its captions. Choose the ' +
          'language of the caption track to use, or leave empty for the first one that is ready.',
        showWhen: {context: 'isAudioOnly', notEquals: false},
      },
      {
        kind: 'number',
        name: 'thresholds.sexual',
        label: 'Sexual content threshold',
        helpText: '0–1. Defaults to 0.7.',
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        kind: 'number',
        name: 'thresholds.violence',
        label: 'Violence threshold',
        helpText: '0–1. Defaults to 0.8.',
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        kind: 'number',
        name: 'sampling_interval',
        label: 'Seconds between samples',
        helpText:
          'At least 5. Defaults to one sample every 10 seconds. Denser sampling costs more.',
        min: 5,
        step: 1,
        integer: true,
      },
      {
        kind: 'number',
        name: 'max_samples',
        label: 'Maximum samples',
        min: 1,
        step: 1,
        integer: true,
      },
      ...SCOPE_FIELDS,
      {
        kind: 'select',
        name: 'on_flagged.action',
        label: 'If the video is flagged',
        helpText:
          'Deleting the playback IDs makes the video unplayable everywhere it is embedded, the ' +
          'moment the job finishes. The asset itself is kept; add a new playback ID in the Mux ' +
          'dashboard, then resync the video.',
        options: [
          {value: '', label: 'Do nothing — just record the scores'},
          {value: 'delete_playback_ids', label: 'Delete every playback ID'},
        ],
        defaultValue: '',
        confirmWarnings: [
          {
            whenValue: 'delete_playback_ids',
            title: 'This run can make the video unplayable',
            body:
              'If the content scores over a threshold, Mux deletes every playback ID on this ' +
              'asset. Playback stops everywhere the video is embedded, not just in Sanity, and ' +
              'anything that needs a playback ID breaks with it, including other workflows in a ' +
              'directive run on this asset. The asset, its captions and the Robots history on ' +
              'this document are kept. Add a new playback ID in the Mux dashboard, then resync ' +
              'the video.',
          },
        ],
      },
    ],
  },
]

export const ROBOTS_CATALOG_BY_KEY = Object.fromEntries(
  ROBOTS_CATALOG.map((definition) => [definition.key, definition]),
) as Record<RobotsWorkflow, RobotsWorkflowDefinition>

export const ROBOTS_CATEGORIES: RobotsCategory[] = [
  'Accessibility',
  'Insights',
  'Structure',
  'Trust & Safety',
]

export function workflowLabel(workflow: string): string {
  return ROBOTS_CATALOG_BY_KEY[workflow as RobotsWorkflow]?.label ?? workflow
}

/** What the run form opens on. It runs on any asset. */
export const DEFAULT_ROBOTS_WORKFLOW: RobotsWorkflow = 'summarize'

/** Why this asset can't run a workflow, as the picker's suffix, or `undefined` when it can. */
export function workflowUnavailableReason(
  definition: RobotsWorkflowDefinition,
  context: RobotsAssetContext = {},
): string | undefined {
  return definition.requiresVideoTrack && context.isAudioOnly === true
    ? 'not available for audio-only'
    : undefined
}

/** `preferred` if this asset can run it, the default workflow otherwise. */
export function availableWorkflow(
  preferred: RobotsWorkflow,
  context: RobotsAssetContext = {},
): RobotsWorkflow {
  return workflowUnavailableReason(ROBOTS_CATALOG_BY_KEY[preferred], context)
    ? DEFAULT_ROBOTS_WORKFLOW
    : preferred
}

/**
 * Expands dotted-path values into the nested `parameters` object. Empty strings, empty arrays
 * and `undefined` are dropped: an untouched optional field must not become a 400.
 */
export function buildRobotsParameters(
  assetId: string,
  values: Record<string, unknown>,
): Record<string, unknown> {
  const parameters: Record<string, unknown> = {asset_id: assetId}

  for (const [path, value] of Object.entries(values)) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value) && value.length === 0) continue

    const segments = path.split('.')
    const last = segments.pop()!
    let target = parameters
    for (const segment of segments) {
      const next = target[segment]
      if (typeof next !== 'object' || next === null) target[segment] = {}
      target = target[segment] as Record<string, unknown>
    }
    target[last] = value
  }

  return parameters
}

// --- Row editors: edited as flat strings, converted on the way out ---

/**
 * One `ask-questions` row. `answerMode` exists because `answer_options` and `free_form_reply`
 * are mutually exclusive.
 */
export interface QuestionRow {
  question: string
  answerOptions: string
  answerMode?: 'options' | 'free_form'
}

export const QUESTION_ANSWER_MODES: RobotsParamOption[] = [
  {value: 'options', label: 'From a list'},
  {value: 'free_form', label: 'In its own words'},
]

export const emptyQuestionRow = (): QuestionRow => ({
  question: '',
  answerOptions: '',
  answerMode: 'options',
})

export interface ReplacementRow {
  find: string
  replace: string
  caseSensitive: boolean
}

export interface SpeakerReplacementRow {
  find: string
  replace: string
}

export interface TaxonomyRow {
  label: string
  description: string
  /** Comma-separated. */
  aliases: string
}

/**
 * A whole taxonomy object, edited as one field so it's sent whole or not at all.
 * `allowOther` is always sent (the API rejects the object without it) and defaults to `true`:
 * `false` filters the model's output down to these values.
 */
export interface TaxonomyValue {
  name: string
  allowOther: boolean
  values: TaxonomyRow[]
}

export const emptyTaxonomyRow = (): TaxonomyRow => ({label: '', description: '', aliases: ''})

export function asTaxonomyValue(value: unknown): TaxonomyValue {
  const partial = (value ?? {}) as Partial<TaxonomyValue>
  return {
    name: typeof partial.name === 'string' ? partial.name : '',
    allowOther: typeof partial.allowOther === 'boolean' ? partial.allowOther : true,
    values: Array.isArray(partial.values) ? partial.values : [],
  }
}

function splitCommaList(text: string | undefined): string[] {
  return (text ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

/** The form's starting values: only the defaults the catalog declares. */
export function defaultParamValues(fields: RobotsParamField[]): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  for (const field of fields) {
    if (field.kind === 'questions') values[field.name] = [emptyQuestionRow()]
    else if (field.defaultValue !== undefined) values[field.name] = field.defaultValue
  }
  return values
}

/** Whether a field is shown. A hidden field is also never sent. */
export function isFieldVisible(
  field: RobotsParamField,
  values: Record<string, unknown>,
  context: RobotsAssetContext = {},
): boolean {
  const condition = field.showWhen
  if (!condition) return true
  if ('context' in condition) return context[condition.context] !== condition.notEquals
  return values[condition.field] === condition.equals
}

export interface RobotsFieldGroup {
  section?: RobotsParamSection
  fields: RobotsParamField[]
}

/** Consecutive fields that share a section become one group. */
export function groupFieldsBySection(fields: RobotsParamField[]): RobotsFieldGroup[] {
  const groups: RobotsFieldGroup[] = []
  for (const field of fields) {
    const last = groups.at(-1)
    if (field.section && last?.section?.id === field.section.id) last.fields.push(field)
    else groups.push({...(field.section && {section: field.section}), fields: [field]})
  }
  return groups
}

function questionsToApi(value: unknown): unknown[] | undefined {
  const rows = Array.isArray(value) ? (value as QuestionRow[]) : []
  const questions = rows
    .filter((row) => row.question.trim() !== '')
    .map((row) => {
      const question = row.question.trim()
      if (row.answerMode === 'free_form') return {question, free_form_reply: true}
      const options = splitCommaList(row.answerOptions)
      return options.length > 0 ? {question, answer_options: options} : {question}
    })
  return questions.length > 0 ? questions : undefined
}

function replacementsToApi(value: unknown): unknown[] | undefined {
  const rows = Array.isArray(value) ? (value as ReplacementRow[]) : []
  const replacements = rows
    .filter((row) => row.find.trim() !== '')
    .map((row) => ({
      find: row.find,
      replace: row.replace,
      ...(row.caseSensitive && {case_sensitive: true}),
    }))
  return replacements.length > 0 ? replacements : undefined
}

/** Both sides are required by the API, so a row missing either is dropped. */
function speakerReplacementsToApi(value: unknown): unknown[] | undefined {
  const rows = Array.isArray(value) ? (value as SpeakerReplacementRow[]) : []
  const replacements = rows
    .map((row) => ({find: row.find.trim(), replace: row.replace.trim()}))
    .filter((row) => row.find !== '' && row.replace !== '')
  return replacements.length > 0 ? replacements : undefined
}

function taxonomyToApi(value: unknown): Record<string, unknown> | undefined {
  const taxonomy = asTaxonomyValue(value)
  const values = taxonomy.values
    .filter((row) => (row.label ?? '').trim() !== '')
    .map((row) => {
      const aliases = splitCommaList(row.aliases)
      const description = (row.description ?? '').trim()
      return {
        label: row.label.trim(),
        ...(description !== '' && {description}),
        ...(aliases.length > 0 && {aliases}),
      }
    })
  // No values, no vocabulary: `validateParams` flags a name left on its own.
  if (values.length === 0) return undefined
  const name = taxonomy.name.trim()
  return {...(name !== '' && {name}), values, allow_other: taxonomy.allowOther}
}

/** One form value as the Robots API expects it, or `undefined` to leave it out. */
function toApiParamValue(field: RobotsParamField, value: unknown): unknown {
  switch (field.kind) {
    case 'questions':
      return questionsToApi(value)
    case 'replacements':
      return replacementsToApi(value)
    case 'speakerReplacements':
      return speakerReplacementsToApi(value)
    case 'taxonomy':
      return taxonomyToApi(value)
    case 'boolean':
      return field.omitWhenFalse && value !== true ? undefined : value
    default:
      if (typeof value === 'string') return value.trim() === '' ? undefined : value.trim()
      return value === null ? undefined : value
  }
}

/** The job's `parameters`, from the form's flat values. */
export function paramsFromFormValues(
  definition: RobotsWorkflowDefinition,
  assetId: string,
  values: Record<string, unknown>,
  context: RobotsAssetContext = {},
): Record<string, unknown> {
  const apiValues: Record<string, unknown> = {}
  for (const field of definition.params) {
    if (field.formOnly || !isFieldVisible(field, values, context)) continue
    const apiValue = toApiParamValue(field, values[field.name])
    if (apiValue !== undefined) apiValues[field.name] = apiValue
  }
  return buildRobotsParameters(assetId, apiValues)
}

/** The warnings the confirm step shows for what the form currently describes. */
export function confirmWarnings(
  definition: RobotsWorkflowDefinition,
  values: Record<string, unknown>,
  context: RobotsAssetContext = {},
): RobotsConfirmWarning[] {
  return definition.params.flatMap((field) => {
    if (!field.confirmWarnings || !isFieldVisible(field, values, context)) return []
    const value = values[field.name] ?? field.defaultValue
    return field.confirmWarnings.filter((warning) => warning.whenValue === value)
  })
}

function taxonomyErrors(field: RobotsParamField, formValue: unknown, apiValue: unknown): string[] {
  if (apiValue === undefined) {
    return asTaxonomyValue(formValue).name.trim() !== ''
      ? [`${field.label}: add at least one value, or clear the taxonomy name.`]
      : []
  }

  const limits = field.taxonomyLimits
  if (!limits) return []
  const sent = apiValue as {
    name?: string
    values: {label: string; description?: string; aliases?: string[]}[]
  }
  const errors: string[] = []
  const exceeds = (length: number | undefined, max: number | undefined) =>
    max !== undefined && (length ?? 0) > max

  if (exceeds(sent.values.length, limits.maxValues)) {
    errors.push(`${field.label}: at most ${limits.maxValues} values.`)
  }
  if (exceeds(sent.name?.length, limits.maxNameLength)) {
    errors.push(`${field.label}: the taxonomy name is at most ${limits.maxNameLength} characters.`)
  }
  const longLabel = sent.values.find((row) => exceeds(row.label.length, limits.maxLabelLength))
  if (longLabel) {
    errors.push(
      `${field.label}: a value is at most ${limits.maxLabelLength} characters — "${longLabel.label.slice(0, 40)}…".`,
    )
  }
  const longDescription = sent.values.find((row) =>
    exceeds(row.description?.length, limits.maxDescriptionLength),
  )
  if (longDescription) {
    errors.push(
      `${field.label}: the description of "${longDescription.label}" is at most ${limits.maxDescriptionLength} characters.`,
    )
  }
  const manyAliases = sent.values.find((row) => exceeds(row.aliases?.length, limits.maxAliases))
  if (manyAliases) {
    errors.push(
      `${field.label}: "${manyAliases.label}" has more than ${limits.maxAliases} aliases.`,
    )
  }
  const longAlias = sent.values
    .flatMap((row) => row.aliases ?? [])
    .find((alias) => exceeds(alias.length, limits.maxAliasLength))
  if (longAlias) {
    errors.push(
      `${field.label}: an alias is at most ${limits.maxAliasLength} characters — "${longAlias.slice(0, 40)}…".`,
    )
  }
  if (exceeds(JSON.stringify(apiValue).length, limits.maxSerializedLength)) {
    errors.push(
      `${field.label}: the whole taxonomy is at most ${limits.maxSerializedLength} characters. Shorten the descriptions, or use fewer values.`,
    )
  }
  return errors
}

function fieldErrors(field: RobotsParamField, apiValue: unknown): string[] {
  if (field.kind === 'number' && typeof apiValue === 'number') {
    if (Number.isNaN(apiValue)) return [`${field.label} must be a number.`]
    if (field.integer && !Number.isInteger(apiValue)) {
      return [`${field.label} must be a whole number.`]
    }
    if (field.min !== undefined && apiValue < field.min) {
      return [`${field.label} must be at least ${field.min}.`]
    }
    if (field.max !== undefined && apiValue > field.max) {
      return [`${field.label} must be at most ${field.max}.`]
    }
  }
  if (field.kind === 'text' && typeof apiValue === 'string' && field.maxLength !== undefined) {
    if (apiValue.length > field.maxLength) {
      return [`${field.label} can be at most ${field.maxLength} characters.`]
    }
  }
  if (Array.isArray(apiValue) && field.maxItems !== undefined && apiValue.length > field.maxItems) {
    return [`${field.label}: at most ${field.maxItems} entries.`]
  }
  if (field.kind === 'stringList' && Array.isArray(apiValue) && field.maxItemLength !== undefined) {
    const max = field.maxItemLength
    const tooLong = apiValue.find((item) => typeof item === 'string' && item.length > max)
    if (tooLong !== undefined) {
      return [`${field.label}: each entry is at most ${max} characters — "${String(tooLong)}".`]
    }
  }
  return []
}

function numberValue(
  definition: RobotsWorkflowDefinition,
  values: Record<string, unknown>,
  name: string,
): number | undefined {
  const field = definition.params.find((candidate) => candidate.name === name)
  const value = field ? toApiParamValue(field, values[name]) : undefined
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

/** Keyed on the parameters, so a workflow that gains a scope gains the rule. */
function scopeErrors(
  definition: RobotsWorkflowDefinition,
  values: Record<string, unknown>,
  context: RobotsAssetContext,
): string[] {
  const start = numberValue(definition, values, 'output_steering.scope.start_time')
  const end = numberValue(definition, values, 'output_steering.scope.end_time')
  const errors: string[] = []
  if (start !== undefined && end !== undefined && start >= end) {
    errors.push('The start time must be before the end time.')
  }
  if (start !== undefined && context.duration !== undefined && start >= context.duration) {
    errors.push(
      `The start time is past the end of the video, which is ${Number(context.duration.toFixed(1))} seconds long.`,
    )
  }
  return errors
}

function workflowErrors(
  definition: RobotsWorkflowDefinition,
  values: Record<string, unknown>,
  context: RobotsAssetContext,
): string[] {
  const errors: string[] = []
  const valueOf = (kind: RobotsParamKind) => {
    const field = definition.params.find((candidate) => candidate.kind === kind)
    return field ? toApiParamValue(field, values[field.name]) : undefined
  }
  const stringsOf = (name: string) =>
    (Array.isArray(values[name]) ? (values[name] as unknown[]) : []).filter(
      (entry): entry is string => typeof entry === 'string',
    )

  switch (definition.key) {
    case 'find-key-moments': {
      // Without shots, selection reads the transcript; audio-only always does.
      const useShots = values['use_shots'] === true
      if (context.isAudioOnly === true && useShots) {
        errors.push(
          '"Use visual evidence (Mux Shots)" is not supported on audio-only videos. Turn it off.',
        )
      }
      if (context.hasCaptions === false && (!useShots || context.isAudioOnly === true)) {
        errors.push(
          context.isAudioOnly === true
            ? 'This audio-only video has no caption track, and audio-only videos always read the transcript. Generate captions first.'
            : 'This video has no caption track. Turn on "Use visual evidence (Mux Shots)", or generate captions first.',
        )
      }
      const min = numberValue(definition, values, 'target_duration_ms.min')
      const max = numberValue(definition, values, 'target_duration_ms.max')
      if ((min === undefined) !== (max === undefined)) {
        errors.push('Set both highlight length bounds, or neither.')
      } else if (min !== undefined && max !== undefined && min > max) {
        errors.push('The minimum highlight length cannot exceed the maximum.')
      }
      break
    }
    case 'generate-chapters':
      if (context.hasCaptions === false) {
        errors.push(
          'This video has no caption track. Chapters are generated from the transcript, so generate captions first.',
        )
      }
      break
    case 'edit-captions':
      if (
        !valueOf('replacements') &&
        !valueOf('speakerReplacements') &&
        values['censor_profanity'] !== true
      ) {
        errors.push('Add a replacement rule or a speaker label, or turn on "Censor profanity".')
      }
      break
    case 'ask-questions': {
      const rows = Array.isArray(values['questions']) ? (values['questions'] as QuestionRow[]) : []
      if (rows.some((row) => row.question.trim().length > 600)) {
        errors.push('A question can be at most 600 characters.')
      }
      // Free-form rows never send their options, so only the rest are checked.
      const longOption = rows
        .filter((row) => row.answerMode !== 'free_form')
        .flatMap((row) => splitCommaList(row.answerOptions))
        .find((option) => option.length > 150)
      if (longOption) errors.push('An answer option can be at most 150 characters.')
      break
    }
    case 'generate-premium-captions': {
      const phrases = stringsOf('phrases')
      const tooManyWords = phrases.find((phrase) => phrase.split(/\s+/).length > 5)
      if (tooManyWords) errors.push(`Phrase hints can be at most 5 words: "${tooManyWords}".`)
      const illegal = phrases.find((phrase) => /[<>{}[\]]/.test(phrase))
      if (illegal) errors.push(`Phrase hints cannot contain < > { } [ ]: "${illegal}".`)
      break
    }
    case 'translate-captions': {
      const illegal = stringsOf('never_translate').find((term) => /[<>]/.test(term))
      if (illegal) errors.push(`Never translate cannot contain < or >: "${illegal}".`)
      break
    }
    default:
      break
  }
  return errors
}

/** Client-side validation, so problems show before a job is billed rather than as a 400. */
export function validateParams(
  definition: RobotsWorkflowDefinition,
  values: Record<string, unknown>,
  context: RobotsAssetContext = {},
): string[] {
  const errors: string[] = []

  for (const field of definition.params) {
    if (!isFieldVisible(field, values, context)) continue
    const apiValue = toApiParamValue(field, values[field.name])
    if (field.isRequired && apiValue === undefined) {
      errors.push(`${field.label} is required.`)
    } else if (field.kind === 'taxonomy') {
      errors.push(...taxonomyErrors(field, values[field.name], apiValue))
    } else if (apiValue !== undefined) {
      errors.push(...fieldErrors(field, apiValue))
    }
  }

  errors.push(...scopeErrors(definition, values, context))
  errors.push(...workflowErrors(definition, values, context))
  return errors
}
