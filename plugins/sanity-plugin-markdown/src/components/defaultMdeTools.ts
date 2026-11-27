// `import type` (not an inline type specifier) so the bundle keeps no side-effect
// `import 'easymde'`, which would break SSR/Node (easymde touches `document` on load)
import type {Options as EasyMdeOptions} from 'easymde'

export const defaultMdeTools: EasyMdeOptions['toolbar'] = [
  'heading',
  'bold',
  'italic',
  '|',
  'quote',
  'unordered-list',
  'ordered-list',
  '|',
  'link',
  'image',
  'code',
  '|',
  'preview',
  'side-by-side',
]
