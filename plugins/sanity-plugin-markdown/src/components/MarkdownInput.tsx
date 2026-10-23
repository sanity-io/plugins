import {Box, Text, useTheme_v2} from '@sanity/ui'
import {rgba} from '@sanity/ui/theme'
// `import type` (not an inline type specifier) so the bundle keeps no side-effect
// `import 'easymde'`, which would break SSR/Node (easymde touches `document` on load)
import type {Options as EasyMdeOptions} from 'easymde'
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from 'react'
// dont import non-types here, it will break SSR on next
import type {SimpleMDEReactProps} from 'react-simplemde-editor'
import {PatchEvent, set, type StringInputProps, unset, useClient} from 'sanity'

import type {MarkdownOptions} from '../schema'

import * as styles from './MarkdownInput.module.css'

const SimpleMdeReact = lazy(() => import('react-simplemde-editor'))

/**
 * The Studio theme tokens `MarkdownInput.module.css` paints with, as the custom
 * properties that stylesheet reads. React's `CSSProperties` does not know
 * custom properties, so the inline `style` is typed through this extension of it.
 */
interface MarkdownThemeProperties extends CSSProperties {
  '--markdown-fg': string
  '--markdown-border': string
  '--markdown-bg': string
  '--markdown-selection-bg': string
}

function MarkdownInputStyles({
  className,
  style,
  children,
  ...props
}: ComponentProps<typeof Box> & {children?: ReactNode}) {
  const {color} = useTheme_v2()
  const themeStyle: MarkdownThemeProperties = {
    '--markdown-fg': color.fg,
    '--markdown-border': color.border,
    '--markdown-bg': color.bg,
    // Match pre-migration EasyMDE selection: translucent focus ring for both
    // CodeMirror's overlay and the browser's native ::selection highlight.
    '--markdown-selection-bg': rgba(color.focusRing, 0.3),
  }

  return (
    <Box
      {...props}
      className={className ? `${styles.root} ${className}` : styles.root}
      style={{...themeStyle, ...style}}
    >
      {children}
    </Box>
  )
}

export interface MarkdownInputProps extends StringInputProps {
  /**
   * These are passed along directly to
   *
   * Note: MarkdownInput sets certain reactMdeProps.options by default.
   * These will be merged with any custom options.
   */
  reactMdeProps?: Omit<SimpleMDEReactProps, 'value' | 'onChange'>
}

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

export function MarkdownInput(props: MarkdownInputProps): React.JSX.Element {
  const {
    value = '',
    onChange,
    elementProps: {onBlur, onFocus, ref: elementRef},
    reactMdeProps: {options: mdeCustomOptions, ...reactMdeProps} = {},
    schemaType,
    focused,
  } = props
  const client = useClient({apiVersion: '2022-01-01'})
  // oxlint-disable-next-line no-unsafe-type-assertion
  const {imageUrl} = (schemaType.options as MarkdownOptions | undefined) ?? {}
  const [shouldAutoFocus, setShouldAutoFocus] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Forward ref to parent form state
  useImperativeHandle(elementRef, () => ref.current)

  const imageUpload = useCallback(
    (file: File, onSuccess: (url: string) => void, onError: (error: string) => void) => {
      client.assets
        .upload('image', file)
        .then((doc) => onSuccess(imageUrl ? imageUrl(doc) : `${doc.url}?w=450`))
        .catch((e) => {
          console.error(e)
          onError(e.message)
        })
    },
    [client, imageUrl],
  )

  const mdeOptions: EasyMdeOptions = useMemo(() => {
    return {
      spellChecker: false,
      sideBySideFullscreen: false,
      uploadImage: true,
      imageUploadFunction: imageUpload,
      toolbar: defaultMdeTools,
      status: false,
      ...mdeCustomOptions,
      autofocus: shouldAutoFocus,
    }
  }, [imageUpload, mdeCustomOptions, shouldAutoFocus])

  useEffect(() => {
    const node = ref.current
    if (!node) return undefined

    if (focused && !shouldAutoFocus) {
      // Do not set autofocus if the field already has focus
      const raf = requestAnimationFrame(() =>
        setShouldAutoFocus(!node.contains(document.activeElement)),
      )
      return () => cancelAnimationFrame(raf)
    }

    if (!focused && shouldAutoFocus) {
      // If `focused` is false, and the current active focus is no longer within the editor, reset autofocus state
      const raf = requestAnimationFrame(() =>
        setShouldAutoFocus(node.contains(document.activeElement)),
      )
      return () => cancelAnimationFrame(raf)
    }

    return undefined
  }, [focused, shouldAutoFocus])

  const handleChange = useCallback(
    (newValue: string) => {
      onChange(PatchEvent.from(newValue ? set(newValue) : unset()))
    },
    [onChange],
  )

  return (
    <MarkdownInputStyles>
      <Suspense fallback={fallback}>
        <SimpleMdeReact
          {...reactMdeProps}
          ref={ref}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          onFocus={onFocus}
          options={mdeOptions}
          spellCheck={false}
        />
      </Suspense>
    </MarkdownInputStyles>
  )
}

const fallback = (
  <Box padding={3}>
    <Text>Loading editor...</Text>
  </Box>
)
