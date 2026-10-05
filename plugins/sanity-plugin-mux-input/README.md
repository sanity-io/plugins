# Mux Video Input Sanity Plugin

This plugin lets you use [Mux](https://www.mux.com) video assets in your Sanity studio.

The Mux plugin for Sanity allows you to easily upload and preview videos.

[Read our blog post](https://www.sanity.io/blog/video-management-with-mux) about this plugin.

Not familiar with Sanity? [Visit www.sanity.io](https://www.sanity.io/)

<img width="623" alt="" src="https://github.com/sanity-io/sanity/assets/81981/7a9de462-746b-4c01-8b12-c55f0cbf6334">

## Installation

```
npm install sanity-plugin-mux-input
```

or

```
yarn add sanity-plugin-mux-input
```

## Quick start

- While in your project folder, run `npm i sanity-plugin-mux-input`.
  Read more about [using plugins in Sanity here](https://beta.sanity.io/docs/platform/studio/plugin).

* Make a schema type that uses the plugin's type `mux.video`, for example:

  ```js
  export default {
    title: 'Video blog post',
    name: 'videoBlogPost',
    type: 'document',
    fields: [
      {title: 'Title', name: 'title', type: 'string'},
      {
        title: 'Video file',
        name: 'video',
        type: 'mux.video',
      },
    ],
  }
  ```

  - Add the `muxInput` import to your plugins:

  ```js
  import {defineConfig} from 'sanity'
  import {muxInput} from 'sanity-plugin-mux-input'

  export default defineConfig({
    plugins: [muxInput()],
  })
  ```

Read more about [schemas in Sanity here](https://www.sanity.io/docs/the-schema).

- Get an API Access Token and enter it into the setup screen
  First time you use the plugin you will be asked to enter your Mux credentials.

The Mux Video API uses an Access Token and Secret Key for authentication.

If you haven't already, generate a new Access Token in the Access Token settings of your Mux account dashboard, and make sure it got permission to both read and write _video_ and read _data_.

The token is stored in the dataset as a document of the type `mux.apiKey` with the id `secrets.mux`.
Having the ID be non-root ensures that only editors are able to see it.

The Mux plugin will find its access tokens by fetching this document.

## Fetching playback IDs and understanding the data structure

When a Mux video is uploaded/chosen in a document via this plugin, it gets stored as a reference to the video document:

```json5
// example document
{
  _type: 'exampleSchemaWithVideo',
  // Example video field
  myVideoField: {
    _type: 'mux.video',
    asset: {
      _type: 'reference',
      _weak: true,
      _ref: '4e37284e-cec2-406d-973c-fdf9ab1e5598', // 👈 ID of the document holding the video's Mux data
    },
  },
}
```

Before you can display videos in your frontend, you need to follow these references to fetch the asset's playback ID, which will be used to create a player. Here's an example GROQ query to expand the video reference in the example data above:

```groq
// Example for fetching data above
*[ _type == "exampleSchemaWithVideo" ] {
  myVideoField {
    asset-> {
      playbackId,
      assetId,
      filename,
    }
  }
}
```

💡 For more information on querying references, refer to the documentation on [Writing GROQ queries for references](https://www.sanity.io/docs/reference-type#96b949753900) or on [Sanity's GraphQL API](https://www.sanity.io/docs/graphql).

For reference, here's an example `mux.videoAsset` document:

```json5
{
  _id: '4e37284e-cec2-406d-973c-fdf9ab1e5598',
  _type: 'mux.videoAsset',
  assetId: '7ovyI76F92n02H00mWP7lOCZMIU00N4iysDiQDNppX026HY',
  filename: 'mux-example-video.mp4',
  status: 'ready',
  playbackId: 'YA02HBpY02fKWHDRMNilo301pdH02LY3k9HTcK43ItGJLWA',
  thumbTime: 65.82,
  // Full Mux asset data:
  data: {
    video_quality: 'plus',
    max_resolution_tier: '1080p',
    aspect_ratio: '16:9',
    created_at: '1706645034',
    duration: 25.492133,
    status: 'ready',
    master_access: 'none',
    max_stored_frame_rate: 29.97,
    playback_ids: [
      {
        id: 'YA02HBpY02fKWHDRMNilo301pdH02LY3k9HTcK43ItGJLWA',
        policy: 'signed',
      },
    ],
    resolution_tier: '1080p',
    ingest_type: 'on_demand_url',
    max_stored_resolution: 'HD',
    tracks: [
      {
        max_channel_layout: 'stereo',
        max_channels: 2,
        id: '00MKMC73SYimw1YTh0102lPJJp9w2R5rHddpNX1N9opAMk',
        type: 'audio',
        primary: true,
        duration: 25.45,
      },
      {
        max_frame_rate: 29.97,
        max_height: 1080,
        id: 'g1wEph3CVvbJL01YNKzAWMyH8N1SxW00WeECGjqwEHW9g',
        type: 'video',
        duration: 25.4254,
        max_width: 1920,
      },
    ],
    id: '7ovyI76F92n02H00mWP7lOCZMIU00N4iysDiQDNppX026HY',
    mp4_support: 'none',
  },
}
```

## Playing videos in the frontend

We recommend using [Mux Player](https://www.mux.com/player) to properly display your videos, through packages like `@mux/mux-player` and `@mux/mux-player-react`. Here's an example of how you can use the Mux Player to display a video in a React component:

```tsx
'use client'

import MuxPlayer from '@mux/mux-player-react'

export default function MuxVideo({playbackId, title}: {playbackId?: string; title?: string}) {
  if (!playbackId) return null

  return <MuxPlayer playbackId={playbackId} metadata={title ? {video_title: title} : undefined} />
}
```

💡 For an end-to-end frontend integration walkthrough, see the [official Mux + Sanity documentation](https://www.mux.com/docs/integrations/sanity).

## Configuring Mux Video uploads

### Signed URLs (private playbacks)

To enable [signed URLs](https://docs.mux.com/docs/security-signed-urls) with content uploaded to Mux, you will need to check the "Enable Signed Urls" option in the Mux Plugin configuration. This feature requires you to set the API Access Token and Secret Key (as per the [Quick start](#quick-start) section).

⚠️ **Important:** To use Signed URLs, the API Access Token must have **System permissions**. Without these permissions, the signing key cannot be created, and authentication will fail.

📌 **Note**: When the signed URL option is triggered, the plugin will cache a `signingKeyPrivate` in a private document in the dataset. This key is used by Mux to sign the uploads, and if it's incorrect your uploads will fail. If that's the case, you can delete the secrets document and try again:

```bash
# Using the Sanity CLI, delete the secrets, then re-open the plugin and configure it again
sanity documents delete secrets.mux
```

More information on signed URLs is available on Mux's [docs](https://docs.mux.com/docs/headless-cms-sanity#advanced-signed-urls)

### Static Renditions (downloadable videos or offline viewing)

To enable [static MP4 renditions](https://docs.mux.com/guides/video/enable-static-mp4-renditions), add `static_renditions` to your plugin configuration. This allows users to download videos for offline viewing.

#### Standard Mode (Recommended)

```js
import {muxInput} from 'sanity-plugin-mux-input'

export default defineConfig({
  plugins: [
    muxInput({
      static_renditions: ['highest'], // Enables MP4 downloads at the highest quality (up to 4K)
      // or
      static_renditions: ['highest', 'audio-only'], // Also includes audio-only (M4A) downloads
    }),
  ],
})
```

**Standard mode options:**

- `'highest'`: Produces an MP4 file with video resolution up to 4K (2160p)
- `'audio-only'`: Produces an M4A (audio-only MP4) file

#### Advanced Mode (Specific Resolutions)

For more control, you can specify exact resolutions:

```js
import {muxInput} from 'sanity-plugin-mux-input'

export default defineConfig({
  plugins: [
    muxInput({
      static_renditions: ['1080p', '720p', 'audio-only'],
    }),
  ],
})
```

**Advanced mode options:**

- Specific resolutions: `'270p'`, `'360p'`, `'480p'`, `'540p'`, `'720p'`, `'1080p'`, `'1440p'`, `'2160p'`
- `'audio-only'`: M4A file

**Important notes:**

- You cannot mix `'highest'` with specific resolutions (e.g., `['highest', '1080p']` is invalid)
- Mux will not upscale videos - renditions requiring upscaling are automatically skipped
- When uploading new assets, editors can choose different rendition settings on a per-video basis

#### Backward Compatibility

The deprecated `mp4_support` field is still supported for backward compatibility:

```js
// ⚠️ Deprecated - use static_renditions instead
muxInput({mp4_support: 'standard'}) // Equivalent to static_renditions: ['highest']
```

More information can be found on Mux's [documentation](https://docs.mux.com/guides/enable-static-mp4-renditions).

### Video resolution (max_resolution_tier)

To edit [max_resolution_tier](https://docs.mux.com/api-reference#video/operation/create-direct-upload) to support other resolutions other than 1080p, add `max_resolution_tier: '1080p' | '1440p' | '2160p'` to the `options` of your `mux.video` schema type. Defaults to `1080p`.

```js
import {muxInput} from 'sanity-plugin-mux-input'

export default defineConfig({
  plugins: [muxInput({max_resolution_tier: '2160p'})],
})
```

When uploading new assets, editors can still choose a lower resolution for each video than configured globally. This option controls the maximum resolution encoded or processed for the uploaded video. The option is particularly important to manage costs when uploaded videos are higher than `1080p` resolution. More information on the feature is available on Mux's [docs](https://docs.mux.com/guides/stream-videos-in-4k). Also, read more on this feature announcement on Mux's [blog](https://www.mux.com/blog/more-pixels-fewer-problems-introducing-4k-support-for-mux-video).

### Video Quality Level (plus or basic)

The [video quality level](https://docs.mux.com/guides/use-video-quality-levels) informs the cost, quality, and available platform features for the asset. You can choose between `plus` and `basic` at the plugin configuration. Defaults to `plus`.

```js
import {muxInput} from 'sanity-plugin-mux-input'

export default defineConfig({
  plugins: [muxInput({video_quality: 'basic'})],
})
```

If `video_quality: 'plus'`, editors can still choose to use the `basic` video quality level on a per-video basis when uploading new assets.

More information on the feature is available on Mux's [documentation](https://www.mux.com/docs/guides/use-video-quality-levels). Also, read more on the feature announcement on Mux's [blog](https://www.mux.com/blog/our-next-pricing-lever-baseline-on-demand-assets-with-free-video-encoding)

### Auto-generated subtitles and captions

If you are using 'plus' video quality level, you can use Mux's [auto-generated subtitles](https://docs.mux.com/guides/video/auto-generated-subtitles) feature. Unless you pass `disableTextTrackConfig: true` to the configuration, users will be able to choose a language to auto-generate subtitles for uploaded videos. Refer to Mux's documentation for the list of supported languages.

You can also define a default language for the upload configuration form:

```js
import {muxInput} from 'sanity-plugin-mux-input'

export default defineConfig({
  plugins: [
    muxInput({
      video_quality: 'plus',
      defaultAutogeneratedSubtitleLang: 'en', // choose from one of the supported languages
    }),
  ],
})
```

If your videos are always spoken in a specific language and you want to include captions by default, you can use `disableTextTrackConfig: true` together with `defaultAutogeneratedSubtitleLang` to transcribe captions for every uploaded asset without needing user interaction.

### Accepted File Types

By default, the plugin accepts both video and audio files (`['video/*', 'audio/*']`). You can configure which file types are accepted either globally at the plugin level or per-field at the schema level.

#### Plugin-level configuration

Configure accepted file types for all `mux.video` fields globally:

```js
import {muxInput} from 'sanity-plugin-mux-input'

export default defineConfig({
  plugins: [
    muxInput({
      acceptedMimeTypes: ['video/*'], // Only accept video files
      // or
      acceptedMimeTypes: ['audio/*'], // Only accept audio files
      // or
      acceptedMimeTypes: ['video/*', 'audio/*'], // Accept both (default)
    }),
  ],
})
```

#### Schema-level configuration

You can also configure `acceptedMimeTypes` for individual fields in your schema, which will override the plugin-level configuration:

```js
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'muxTest',
  title: 'Mux Files',
  type: 'document',
  fields: [
    defineField({
      name: 'audioFile',
      title: 'Audio File',
      type: 'mux.video',
      options: {
        acceptedMimeTypes: ['audio/*'],
      },
    }),
    defineField({
      name: 'videoFile',
      title: 'Video File',
      type: 'mux.video',
      options: {
        acceptedMimeTypes: ['video/*'],
      },
    }),
    defineField({
      name: 'either',
      title: 'Either File',
      type: 'mux.video',
    }),
  ],
})
```

The `acceptedMimeTypes` option controls the `accept` attribute on the file input, which filters which file types users can select when uploading. This affects both the file picker dialog and drag-and-drop file validation.

📌 **Note**: This option accepts an array of MIME type patterns. The valid values are:

- `'video/*'` - Accepts all video file types
- `'audio/*'` - Accepts all audio file types

For more information on the `accept` attribute, refer to the [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/accept).

### File size and duration validation

You can configure maximum file size and video duration limits to prevent users from uploading videos that exceed your requirements. These validations run before the upload starts, providing immediate feedback to users.

#### Plugin-level configuration

Set validation limits for all `mux.video` fields globally:

```js
import {muxInput} from 'sanity-plugin-mux-input'

export default defineConfig({
  plugins: [
    muxInput({
      maxAssetFileSize: 1024 * 1024 * 1024, // 1 GB in bytes
      maxAssetDuration: 2 * 60 * 60, // 2 hours in seconds
    }),
  ],
})
```

#### Schema-level configuration

You can override the global limits for specific fields, allowing different validation rules for different use cases:

```js
import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'muxTest',
  title: 'Mux Files',
  type: 'document',
  fields: [
    defineField({
      name: 'shortVideo',
      title: 'Short Video (max 1 minute)',
      type: 'mux.video',
      options: {
        maxAssetFileSize: 100 * 1024 * 1024, // 100 MB
        maxAssetDuration: 60, // 1 minute
      },
    }),
    defineField({
      name: 'longVideo',
      title: 'Long Video (max 2 hours)',
      type: 'mux.video',
      options: {
        maxAssetFileSize: 1024 * 1024 * 1024, // 1 GB
        maxAssetDuration: 2 * 60 * 60, // 2 hours
      },
    }),
    defineField({
      name: 'unlimitedVideo',
      title: 'Unlimited Video',
      type: 'mux.video',
      // Uses plugin defaults or no validation if not configured
    }),
  ],
})
```

### Mux API host (`muxApiHost`)

By default, the plugin sends Mux requests (`/v<apiVersion>/addons/mux/...`) to the same API host as the rest of the Studio. Set `muxApiHost` to send only these Mux requests to a different host, for example a local development server. Queries, listeners and `mux.videoAsset` documents still use the Studio API host.

```js
import {muxInput} from 'sanity-plugin-mux-input'

export default defineConfig({
  plugins: [
    muxInput({
      muxApiHost: 'http://127.0.0.1:8080',
    }),
  ],
})
```

- The value must be an `http` or `https` origin without a path. The plugin adds `/v<apiVersion>/addons/mux/...`.
- The plugin uses the host as-is. It does not add the project id to the hostname. If your server needs the project id in the hostname, include it in the value, for example `http://<projectId>.example.test:8000`.
- Auth: if the Studio uses token auth, the plugin sends the token as `Authorization: Bearer <token>` to `muxApiHost`. Session cookies for the Studio API host are not sent to a different host, so cookie-only auth does not work with this option. Only use a host that you trust with the token.
- The requests use `credentials: 'include'`. The host must allow CORS from the Studio origin with `Access-Control-Allow-Credentials: true` and must not reply with `Access-Control-Allow-Origin: *`.

## Mux Robots

[Mux Robots](https://www.mux.com/docs/guides/robots) runs AI workflows on your videos: premium captions, caption edits and translations, dubbing, summaries, questions, key moments, thumbnails, engagement insights, chapters, scenes and moderation. Open **Robots** from a video's menu in the input, or from the **Robots** tab of a video in the Videos tool, to run a workflow, follow its jobs and read their outputs.

Every run consumes Mux AI units, and the plugin asks for confirmation before each one. See [Robots pricing](https://www.mux.com/docs/pricing/overview#mux-robots-pricing).

### Access token

Robots needs an access token with the `robots:*` scope, and the Robots terms accepted in your Mux dashboard. The scope can't be added to an existing token: create a new one and paste it into **Configure API**. A token without the scope keeps working for everything else, and the Robots panel explains what's missing.

### Who can run Robots

Only administrators can start or cancel runs by default. Everyone else sees the jobs, runs and outputs, with a note instead of the run controls. Use `allowedRolesForRobots` to choose the roles, or `[]` to let every role run Robots:

```js
muxInput({
  allowedRolesForRobots: ['administrator', 'editor'],
})
```

This only hides controls in the Studio. It isn't a permission: any member of the project can call the Mux proxy.

### Directives on upload

A [directive](https://www.mux.com/docs/guides/robots-directives) runs several workflows in order. List the ones to attach to every new upload with `defaultDirectiveIds`, at the plugin level or per field in the schema `options`:

```js
muxInput({
  defaultDirectiveIds: ['your-directive-id'],
})
```

The upload dialog lists them, checked. With none configured, it says so and links here. People who can run Robots can uncheck one for a single upload; everyone else sees the list read-only, and the directives still attach. A configured directive the Mux account doesn't have is shown and not attached. If the token can't use Robots, the directives are still attached and the dialog warns that they won't run; the video uploads either way.

With `disableUploadConfig` and `disableTextTrackConfig` both on, the upload dialog is skipped, so every configured directive attaches with no opt-out.

Directives are authored in Mux. The Robots panel starts a directive on one video at a time.

### What's stored on the video document

Robots data lives at the root of each `mux.videoAsset` document, next to `data`:

- `robotsJobs`: every job Mux reports for the asset, whoever started it (the Studio, a directive, the dashboard or the API). Records are only added and updated, so the history outlives Mux, which deletes jobs after 30 days.
- `robotsOutputs`: the newest completed `summarize` (title, description, tags) and `moderate` (threshold result, highest scores) outputs. Every other output is read from Mux while the job exists.
- `robotsDirectiveRuns`: directive runs started from the Studio.
- `robotsPendingCreates`: runs requested but not yet confirmed by Mux. They keep a second run from starting by accident, and clear themselves once Mux confirms.

```groq
*[_type == "mux.videoAsset" && defined(robotsOutputs.summarize)]{
  assetId,
  "title": robotsOutputs.summarize.title,
  "tags": robotsOutputs.summarize.tags,
  "flagged": robotsOutputs.moderate.exceedsThreshold
}
```

Workflows that write to the Mux asset are picked up when their job finishes: new caption and audio tracks, the chapters track from **Generate chapters**, and the thumbnail from **Find best thumbnails** when it's asked to set it, which the plugin also copies into `thumbTime`. A chapters track is listed apart from the captions and never counts as one.

While a job, directive run or unconfirmed run is in progress, the plugin checks Mux every 6 seconds, including when the Robots panel is closed, as long as the document is open. A Studio that never opens Robots and configures no directives makes no Robots requests.

## Contributing

This plugin lives in the [`sanity-io/plugins`](https://github.com/sanity-io/plugins) monorepo. Issues and pull requests are welcome — see the monorepo [CONTRIBUTING guide](https://github.com/sanity-io/plugins/blob/main/CONTRIBUTING.md) for development, testing, and release instructions.

For frontend playback and end-to-end integration guidance, refer to the [official Mux + Sanity documentation](https://www.mux.com/docs/integrations/sanity).

## License

MIT-licensed. See LICENSE.
