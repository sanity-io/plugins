import {renderToString} from 'katex'
import {useMemo} from 'react'

import 'katex/dist/katex.min.css'

export interface LatexPreviewProps {
  body?: string
  layout?: string
}

export const LatexPreview = (props: LatexPreviewProps) => {
  const latex = props?.body || ''
  const isInline = props.layout === 'inline'

  const html = useMemo(
    () =>
      renderToString(latex, {
        displayMode: !isInline,
        throwOnError: false,
      }),
    [latex, isInline],
  )

  return isInline ? (
    <span dangerouslySetInnerHTML={{__html: html}} />
  ) : (
    <div dangerouslySetInnerHTML={{__html: html}} />
  )
}
