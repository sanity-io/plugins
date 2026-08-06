import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const fgVar = createVar()
export const borderVar = createVar()
export const bgVar = createVar()
export const selectionHoveredBgVar = createVar()

export const markdownInput = style({})

globalStyle(`${markdownInput} .CodeMirror.CodeMirror`, {
  color: fgVar,
  borderColor: borderVar,
  backgroundColor: 'inherit',
})

globalStyle(`${markdownInput} .cm-s-easymde .CodeMirror-cursor`, {
  borderColor: fgVar,
})

globalStyle(`${markdownInput} .editor-toolbar, ${markdownInput} .editor-preview-side`, {
  borderColor: borderVar,
})

globalStyle(
  `${markdownInput} .CodeMirror-focused .CodeMirror-selected.CodeMirror-selected.CodeMirror-selected`,
  {
    backgroundColor: selectionHoveredBgVar,
  },
)

globalStyle(`${markdownInput} .CodeMirror-selected.CodeMirror-selected.CodeMirror-selected`, {
  backgroundColor: bgVar,
})

globalStyle(`${markdownInput} .editor-toolbar > *`, {
  color: fgVar,
})

globalStyle(
  [
    `${markdownInput} .editor-toolbar > .active`,
    `${markdownInput} .editor-toolbar > button:hover`,
    `${markdownInput} .editor-preview pre`,
    `${markdownInput} .cm-s-easymde .cm-comment`,
  ].join(', '),
  {
    backgroundColor: bgVar,
  },
)

globalStyle(`${markdownInput} .editor-preview`, {
  backgroundColor: bgVar,
})

globalStyle(
  [
    `${markdownInput} .editor-preview h1`,
    `${markdownInput} .editor-preview h2`,
    `${markdownInput} .editor-preview h3`,
    `${markdownInput} .editor-preview h4`,
    `${markdownInput} .editor-preview h5`,
    `${markdownInput} .editor-preview h6`,
  ].join(', '),
  {
    fontSize: 'revert',
  },
)

globalStyle(
  [`${markdownInput} .editor-preview ul`, `${markdownInput} .editor-preview li`].join(', '),
  {
    listStyle: 'revert',
    padding: 'revert',
  },
)

globalStyle(`${markdownInput} .editor-preview a`, {
  textDecoration: 'revert',
})
