import {CloseIcon, ImageIcon} from '@sanity/icons'
import {forwardRef, useState} from 'react'

type Props = {
  isDeleted: boolean
  imageUrl: string
  title: string
}

const SfccDocumentStatus = forwardRef<HTMLDivElement, Props>((props, ref) => {
  const {isDeleted, imageUrl, title} = props

  const [imageVisible, setImageVisible] = useState(true)

  const handleImageError = () => setImageVisible(false)

  return (
    <div
      ref={ref}
      style={{
        alignItems: 'center',
        borderRadius: 'inherit',
        display: 'flex',
        height: '100%',
        justifyContent: 'center',
        overflow: 'hidden',
        width: '100%',
      }}
    >
      {imageVisible && imageUrl ? (
        <img
          onError={handleImageError}
          src={imageUrl.replace('/large/', '/small/')}
          style={{
            height: '100%',
            left: 0,
            objectFit: 'contain',
            position: 'absolute',
            top: 0,
            width: '100%',
          }}
          alt={`${title} preview`}
        />
      ) : (
        <ImageIcon style={{position: 'absolute'}} />
      )}

      {isDeleted && (
        <CloseIcon
          style={{
            background: 'rgba(255, 0, 0, 0.7)',
            color: 'rgba(255, 255, 255, 0.85)',
            height: '100%',
            position: 'relative',
            width: '100%',
          }}
        />
      )}
    </div>
  )
})

export {SfccDocumentStatus}
