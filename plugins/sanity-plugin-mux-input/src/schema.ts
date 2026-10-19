export const muxVideoSchema = {
  name: 'mux.video',
  type: 'object',
  title: 'Video asset reference',
  fields: [
    {
      title: 'Video',
      name: 'asset',
      type: 'reference',
      weak: true,
      to: [{type: 'mux.videoAsset'}],
    },
  ],
}

const muxTrack = {
  name: 'mux.track',
  type: 'object',
  fields: [
    {type: 'string', name: 'id'},
    {type: 'string', name: 'type'},
    {type: 'number', name: 'max_width'},
    {type: 'number', name: 'max_frame_rate'},
    {type: 'number', name: 'duration'},
    {type: 'number', name: 'max_height'},
    {type: 'string', name: 'language_code'},
    {type: 'string', name: 'name'},
    {type: 'string', name: 'status'},
    {type: 'string', name: 'text_source'},
    {type: 'string', name: 'text_type'},
  ],
}

const muxPlaybackId = {
  name: 'mux.playbackId',
  type: 'object',
  fields: [
    {type: 'string', name: 'id'},
    {type: 'string', name: 'policy'},
  ],
}

const muxStaticRenditionFile = {
  name: 'mux.staticRenditionFile',
  type: 'object',
  fields: [
    {type: 'string', name: 'name'},
    {type: 'string', name: 'ext'},
    {type: 'number', name: 'height'},
    {type: 'number', name: 'width'},
    {type: 'number', name: 'bitrate'},
    {type: 'string', name: 'filesize'},
    {type: 'string', name: 'type'},
    {type: 'string', name: 'status'},
    {type: 'string', name: 'resolution_tier'},
    {type: 'string', name: 'resolution'},
    {type: 'string', name: 'id'},
    {type: 'string', name: 'passthrough'},
  ],
}

const muxStaticRenditions = {
  name: 'mux.staticRenditions',
  type: 'object',
  fields: [
    {type: 'string', name: 'status'},
    {
      name: 'files',
      type: 'array',
      of: [{type: 'mux.staticRenditionFile'}],
    },
  ],
}

const muxMasterFile = {
  name: 'mux.masterFile',
  type: 'object',
  fields: [
    {type: 'string', name: 'status'},
    {type: 'string', name: 'url'},
  ],
}

const muxAssetData = {
  name: 'mux.assetData',
  title: 'Mux asset data',
  type: 'object',
  fields: [
    {
      type: 'string',
      name: 'resolution_tier',
    },
    {
      type: 'string',
      name: 'upload_id',
    },
    {
      type: 'string',
      name: 'created_at',
    },
    {
      type: 'string',
      name: 'id',
    },
    {
      type: 'string',
      name: 'status',
    },
    {
      type: 'string',
      name: 'max_stored_resolution',
    },
    {
      type: 'string',
      name: 'passthrough',
    },
    {
      type: 'string',
      name: 'encoding_tier',
    },
    {
      type: 'string',
      name: 'video_quality',
    },
    {
      type: 'string',
      name: 'master_access',
    },
    {
      type: 'string',
      name: 'aspect_ratio',
    },
    {
      type: 'number',
      name: 'duration',
    },
    {
      type: 'number',
      name: 'max_stored_frame_rate',
    },
    {
      type: 'string',
      name: 'mp4_support',
    },
    {
      type: 'string',
      name: 'max_resolution_tier',
    },
    {
      type: 'number',
      name: 'thumbnail_time',
    },
    {
      name: 'tracks',
      type: 'array',
      of: [{type: 'mux.track'}],
    },
    {
      name: 'playback_ids',
      type: 'array',
      of: [{type: 'mux.playbackId'}],
    },
    {
      name: 'static_renditions',
      type: 'mux.staticRenditions',
    },
    {
      name: 'master',
      type: 'mux.masterFile',
    },
  ],
}

// Robots data lives at the document root: every refresh replaces `data` whole.
const muxRobotsJob = {
  name: 'mux.robotsJob',
  type: 'object',
  fields: [
    {type: 'string', name: 'id'},
    {type: 'string', name: 'workflow'},
    {type: 'string', name: 'status'},
    {type: 'number', name: 'created_at'},
    {type: 'number', name: 'updated_at'},
    {type: 'number', name: 'units_consumed'},
    {type: 'string', name: 'error'},
    {type: 'boolean', name: 'thumbnailApplied'},
  ],
}

const muxRobotsOutputs = {
  name: 'mux.robotsOutputs',
  type: 'object',
  fields: [
    {
      name: 'summarize',
      type: 'object',
      fields: [
        {type: 'string', name: 'jobId'},
        {type: 'number', name: 'completedAt'},
        {type: 'string', name: 'title'},
        {type: 'text', name: 'description'},
        {type: 'array', name: 'tags', of: [{type: 'string'}]},
      ],
    },
    {
      name: 'moderate',
      type: 'object',
      fields: [
        {type: 'string', name: 'jobId'},
        {type: 'number', name: 'completedAt'},
        {type: 'boolean', name: 'exceedsThreshold'},
        {
          name: 'maxScores',
          type: 'object',
          fields: [
            {type: 'number', name: 'sexual'},
            {type: 'number', name: 'violence'},
          ],
        },
      ],
    },
  ],
}

const muxRobotsDirectiveRun = {
  name: 'mux.robotsDirectiveRun',
  type: 'object',
  fields: [
    {type: 'string', name: 'runId'},
    {type: 'string', name: 'directiveId'},
    {type: 'string', name: 'status'},
    {type: 'number', name: 'startedAt'},
    {type: 'number', name: 'completedAt'},
    {type: 'array', name: 'jobIds', of: [{type: 'string'}]},
  ],
}

const muxRobotsPendingCreate = {
  name: 'mux.robotsPendingCreate',
  type: 'object',
  fields: [
    {type: 'string', name: 'requestId'},
    {type: 'string', name: 'kind'},
    {type: 'string', name: 'workflow'},
    {type: 'string', name: 'directiveId'},
    {type: 'number', name: 'requestedAt'},
  ],
}

const muxVideoAsset = {
  name: 'mux.videoAsset',
  type: 'document',
  title: 'Video asset',
  fields: [
    {
      type: 'string',
      name: 'status',
    },
    {
      type: 'string',
      name: 'assetId',
    },
    {
      type: 'string',
      name: 'playbackId',
    },
    {
      type: 'string',
      name: 'filename',
    },
    {
      type: 'number',
      name: 'thumbTime',
    },
    {
      type: 'mux.assetData',
      name: 'data',
    },
    {
      name: 'robotsJobs',
      type: 'array',
      of: [{type: 'mux.robotsJob'}],
    },
    {
      type: 'mux.robotsOutputs',
      name: 'robotsOutputs',
    },
    {
      name: 'robotsDirectiveRuns',
      type: 'array',
      of: [{type: 'mux.robotsDirectiveRun'}],
    },
    {
      name: 'robotsPendingCreates',
      type: 'array',
      of: [{type: 'mux.robotsPendingCreate'}],
    },
  ],
}

export const schemaTypes = [
  muxTrack,
  muxPlaybackId,
  muxStaticRenditionFile,
  muxStaticRenditions,
  muxMasterFile,
  muxAssetData,
  muxRobotsJob,
  muxRobotsOutputs,
  muxRobotsDirectiveRun,
  muxRobotsPendingCreate,
  muxVideoAsset,
]
