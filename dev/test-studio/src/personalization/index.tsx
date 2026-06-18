import {fieldLevelExperiments} from '@sanity/personalization-plugin'
import {defineField, definePlugin, defineType} from 'sanity'

const experiments = [
  {
    id: 'homepage-headline',
    label: 'Homepage Headline Test',
    variants: [
      {id: 'control', label: 'Control'},
      {id: 'emotional', label: 'Emotional Appeal'},
    ],
  },
  {
    id: 'signup-cta',
    label: 'Signup CTA Test',
    variants: [
      {id: 'control', label: 'Control'},
      {id: 'urgent', label: 'Urgency Messaging'},
      {id: 'benefit', label: 'Benefit Focused'},
    ],
  },
]

const personalizationTest = defineType({
  type: 'document',
  name: 'personalizationTest',
  title: 'Personalization',
  fields: [
    defineField({type: 'string', name: 'title', title: 'Title'}),
    defineField({
      type: 'experimentString',
      name: 'headline',
      title: 'Headline (A/B testable)',
    }),
    defineField({
      type: 'experimentText',
      name: 'description',
      title: 'Description (A/B testable)',
    }),
  ],
})

export const personalizationExample = definePlugin(() => ({
  schema: {types: [personalizationTest]},
  plugins: [
    fieldLevelExperiments({
      fields: ['string', 'text'],
      experiments,
    }),
  ],
}))
