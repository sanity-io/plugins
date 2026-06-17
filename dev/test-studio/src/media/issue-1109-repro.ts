import {defineArrayMember, defineField, defineType} from 'sanity'
import {mediaField} from 'sanity-plugin-media'

/**
 * Document type used to reproduce
 * https://github.com/sanity-io/plugins/issues/1109
 *
 * The bug: when the asset edit dialog is opened from inside a page-builder
 * array item (array of objects, where one of the object types has an image
 * field that uses `sanity-plugin-media` as the asset source), the
 * "Save and close" button does nothing. The Download, Copy URL and Delete
 * buttons in the same dialog still work. The same flow works when opening
 * the media browser from a top-level image field, or from the Media tool tab.
 *
 * Three users have confirmed (nettum, fredrikj31, alexelash). The author
 * also reports tag create/edit is broken in the same nested context, which
 * points at the react-hook-form submit path generally, not just one button.
 *
 * Steps in this repro:
 *   1. Open Studio (`pnpm --filter test-studio dev`), kitchen-sink workspace.
 *   2. Create a new `Issue #1109 — Page builder repro` document.
 *   3. Add an item to the `Page builder` array, choose `Image block`.
 *   4. On the image field inside that block, click `Select` -> `Media`.
 *   5. In the media browser, click the edit pen on any uploaded asset.
 *   6. Edit a field (e.g. Alt text) and click `Save and close`.
 *
 * Expected: changes save, dialog closes.
 * Actual: nothing happens. Compare against the top-level `image` field at
 * the root of this same document, where the same flow works.
 */

const imageBlock = defineType({
  type: 'object',
  name: 'issue1109ImageBlock',
  title: 'Image block',
  fields: [
    defineField({type: 'string', name: 'caption', title: 'Caption'}),
    mediaField({
      name: 'image',
      title: 'Image',
      type: 'image',
    }),
  ],
})

export const issue1109Repro = defineType({
  type: 'document',
  name: 'issue1109Repro',
  title: 'Issue #1109 — Page builder repro',
  fields: [
    defineField({
      type: 'string',
      name: 'title',
      title: 'Title',
    }),
    mediaField({
      name: 'topLevelImage',
      title: 'Top-level image (works — control case)',
      description:
        'Opening the media browser here, editing an asset, and clicking Save and close works as expected.',
      type: 'image',
    }),
    defineField({
      name: 'pageBuilder',
      title: 'Page builder (repro — Save and close is dead from in here)',
      description:
        'Add an Image block, open the media browser from its image field, then try to edit an asset.',
      type: 'array',
      of: [defineArrayMember({type: 'issue1109ImageBlock'})],
    }),
  ],
})

export const issue1109ReproTypes = [imageBlock, issue1109Repro]
