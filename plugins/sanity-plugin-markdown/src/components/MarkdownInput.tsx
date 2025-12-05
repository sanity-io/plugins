// dont import non-types here, it will break SSR on next
import type {SimpleMDEReactProps} from 'react-simplemde-editor'

import {Box, Text} from '@sanity/ui'
import {type Options as EasyMdeOptions} from 'easymde'
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import {PatchEvent, set, type StringInputProps, unset, useClient} from 'sanity'
import {styled} from 'styled-components'

import type {MarkdownOptions} from '../schema'

const SimpleMdeReact = lazy(() => import('react-simplemde-editor'))

const MarkdownInputStyles = styled(Box)`
  & .CodeMirror.CodeMirror {
    color: ${({theme}) => theme.sanity.color.card.enabled.fg};
    border-color: ${({theme}) => theme.sanity.color.card.enabled.border};
    background-color: inherit;
  }

  & .cm-s-easymde .CodeMirror-cursor {
    border-color: ${({theme}) => theme.sanity.color.card.enabled.fg};
  }

  & .editor-toolbar,
  .editor-preview-side {
    border-color: ${({theme}) => theme.sanity.color.card.enabled.border};
  }

  & .CodeMirror-focused .CodeMirror-selected.CodeMirror-selected.CodeMirror-selected {
    background-color: ${({theme}) => theme.sanity.color.selectable?.primary?.hovered?.bg};
  }

  & .CodeMirror-selected.CodeMirror-selected.CodeMirror-selected {
    background-color: ${({theme}) => theme.sanity.color.card.enabled.bg};
  }

  & .editor-toolbar > * {
    color: ${({theme}) => theme.sanity.color.card.enabled.fg};
  }

  & .editor-toolbar > .active,
  .editor-toolbar > button:hover,
  .editor-preview pre,
  .cm-s-easymde .cm-comment {
    background-color: ${({theme}) => theme.sanity.color.card.enabled.bg};
  }

  & .editor-preview {
    background-color: ${({theme}) => theme.sanity.color.card.enabled.bg};

    & h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      font-size: revert;
    }

    & ul,
    li {
      list-style: revert;
      padding: revert;
    }

    & a {
      text-decoration: revert;
    }
  }
`

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
