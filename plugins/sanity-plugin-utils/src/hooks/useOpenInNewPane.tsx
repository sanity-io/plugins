import {useCallback, useContext} from 'react'
import {RouterContext} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver/router'
import {usePaneRouter} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver/structure'

export function useOpenInNewPane(id?: string, type?: string) {
  const routerContext = useContext(RouterContext)
  const {routerPanesState, groupIndex} = usePaneRouter()

  const openInNewPane = useCallback(() => {
    if (!routerContext || !id || !type) {
      return
    }

    const panes = [...routerPanesState]
    panes.splice(groupIndex + 1, 0, [
      {
        id: id,
        params: {type},
      },
    ])

    const href = routerContext.resolvePathFromState({panes})
    routerContext.navigateUrl({path: href})
  }, [id, type, routerContext, routerPanesState, groupIndex])

  return openInNewPane
}
