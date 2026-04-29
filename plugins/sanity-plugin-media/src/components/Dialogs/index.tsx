import useTypedSelector from '../../hooks/useTypedSelector'
import type {Dialog} from '../../types'
import DialogAssetEdit from '../DialogAssetEdit'
import DialogConfirm from '../DialogConfirm'
import DialogSearchFacets from '../DialogSearchFacets'
import DialogTagCreate from '../DialogTagCreate'
import DialogTagEdit from '../DialogTagEdit'
import DialogTags from '../DialogTags'

function renderDialogs(dialogs: Dialog[], index: number) {
  if (dialogs.length === 0 || index >= dialogs.length) {
    return null
  }

  const dialog = dialogs[index]
  if (!dialog) {
    return null
  }
  const childDialogs = renderDialogs(dialogs, index + 1)

  if (dialog.type === 'assetEdit') {
    return (
      <DialogAssetEdit dialog={dialog} key={index}>
        {childDialogs}
      </DialogAssetEdit>
    )
  }

  if (dialog.type === 'confirm') {
    return (
      <DialogConfirm dialog={dialog} key={index}>
        {childDialogs}
      </DialogConfirm>
    )
  }

  if (dialog.type === 'searchFacets') {
    return (
      <DialogSearchFacets dialog={dialog} key={index}>
        {childDialogs}
      </DialogSearchFacets>
    )
  }

  if (dialog.type === 'tagCreate') {
    return (
      <DialogTagCreate dialog={dialog} key={index}>
        {childDialogs}
      </DialogTagCreate>
    )
  }

  if (dialog.type === 'tagEdit') {
    return (
      <DialogTagEdit dialog={dialog} key={index}>
        {childDialogs}
      </DialogTagEdit>
    )
  }

  if (dialog.type === 'tags') {
    return (
      <DialogTags dialog={dialog} key={index}>
        {childDialogs}
      </DialogTags>
    )
  }

  return null
}

const Dialogs = () => {
  // Redux
  const currentDialogs = useTypedSelector((state) => state.dialog.items)

  return renderDialogs(currentDialogs, 0)
}

export default Dialogs
