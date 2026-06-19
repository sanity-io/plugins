import {formSchema} from '@sanity/form-toolkit/form-schema'
import {definePlugin} from 'sanity'

export const formToolkitExample = definePlugin(() => ({
  plugins: [formSchema()],
}))
