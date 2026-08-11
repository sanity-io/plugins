import {usePortal} from '@sanity/ui'
import {type PopoverProps} from '@sanity/ui/popover'

export function usePortalPopoverProps(): PopoverProps {
  const portal = usePortal()

  return {
    animate: true,
    constrainSize: true,
    floatingBoundary: portal.element,
    portal: true,
    referenceBoundary: portal.element,
  }
}
