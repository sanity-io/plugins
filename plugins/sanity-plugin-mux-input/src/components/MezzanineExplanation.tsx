// oxlint-disable typescript/no-deprecated - legacy code will be lint-cleaned in a follow-up PR
import {Stack, Text} from '@sanity/ui'

/** Explains what the mezzanine file is and how it differs from the streamable MP4 renditions. */
export default function MezzanineExplanation() {
  return (
    <Stack space={3}>
      <Text size={1} muted>
        When you enable the mezzanine file, Mux creates a copy equivalent in quality to your
        original video — ideal for offline editing or archiving. Unlike the streamable MP4 (static)
        renditions, it is not meant for streaming.
      </Text>
      <Text size={1} muted>
        The file is prepared in the background and may take a few minutes depending on the
        asset&apos;s duration and resolution. Enabling is free and the download stays available for
        24 hours.
      </Text>
    </Stack>
  )
}
