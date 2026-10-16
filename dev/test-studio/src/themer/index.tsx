import {ComponentIcon} from '@sanity/icons/Component'
import {themerTool} from '@sanity/themer/tool'
import {lazy} from 'react'
import {definePlugin} from 'sanity'
import {route} from 'sanity/router'

const Ui5Tool = lazy(() => import('./ui5/Ui5Tool'))

/**
 * Themer, with a "UI v5" tool that explores how far its themes reach into
 * `ui5` — the `@sanity/ui` v5 alpha the Studio renders next to v4 — and what
 * theming v5 fully would take.
 */
export const themerExample = definePlugin(() => ({
  name: 'test-studio-themer',
  plugins: [themerTool({title: 'Themer 2.0'})],
  tools: [
    {
      name: 'ui5',
      title: 'UI v5',
      icon: ComponentIcon,
      component: Ui5Tool,
      router: route.create('/:section'),
    },
  ],
}))
