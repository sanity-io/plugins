import {defineArrayMember, defineField, definePlugin, defineType} from 'sanity'
import {latexInput} from 'sanity-plugin-latex-input'

const mathInlineIcon = () => (
  <span>
    <span style={{fontWeight: 'bold'}}>∑</span>b
  </span>
)
const mathBlockIcon = () => <span style={{fontWeight: 'bold'}}>∑</span>

const latexTest = defineType({
  type: 'document',
  name: 'latexTest',
  title: 'LaTeX',
  fields: [
    defineField({type: 'string', name: 'title', title: 'Title'}),
    defineField({
      type: 'array',
      name: 'body',
      title: 'Body with inline and block LaTeX',
      of: [
        defineArrayMember({
          type: 'block',
          of: [defineArrayMember({type: 'latex', icon: mathInlineIcon, title: 'Inline math'})],
        }),
        defineArrayMember({type: 'latex', icon: mathBlockIcon, title: 'Math block'}),
      ],
    }),
  ],
})

export const latexInputExample = definePlugin(() => ({
  schema: {types: [latexTest]},
  plugins: [latexInput()],
}))
