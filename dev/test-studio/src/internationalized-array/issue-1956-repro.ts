import {defineField, defineType} from 'sanity'

/**
 * Document type used to try
 * https://github.com/sanity-io/plugins/issues/1956
 *
 * Options on an internationalized array field must reach the underlying
 * value field. Open this document in the `home` workspace and use the file
 * picker on Subtitles/Captions. It should only offer `.vtt` and `.srt` files.
 */
export const issue1956Repro = defineType({
  name: 'issue1956Repro',
  title: 'Issue #1956 reproduction',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      title: 'Subtitles/Captions',
      name: 'subtitles',
      type: 'internationalizedArrayFile',
      description: 'The file picker should only offer .vtt and .srt files.',
      options: {
        accept: '.vtt,.srt,text/vtt,application/x-subrip',
        collapsed: true,
      },
    }),
  ],
})
