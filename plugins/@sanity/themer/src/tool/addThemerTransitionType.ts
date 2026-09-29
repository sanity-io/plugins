import {addTransitionType} from 'react'

import {layoutTransitionType, viewTransitionTypes} from './ViewTransitions.css'

/**
 * Adds the default sanity-themer transition type, which allows custom view transition overrides, as well as customization in userland
 */
export function addThemerTransitionType(type: keyof typeof viewTransitionTypes) {
  if (!(type in viewTransitionTypes)) {
    throw new Error(`Invalid transition type`, {cause: {type}})
  }
  addTransitionType(viewTransitionTypes[type])
  // Used to mark that a themer transition is happening, can be styled with vanilla css, but also by setting class props on <ViewTransition>
  addTransitionType(layoutTransitionType)
}
