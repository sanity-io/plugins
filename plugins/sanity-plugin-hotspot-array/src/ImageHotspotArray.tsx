import {getImageDimensions} from '@sanity/asset-utils'
import {createImageUrlBuilder} from '@sanity/image-url'
import {Card, Flex, Stack} from '@sanity/ui'
import {randomKey} from '@sanity/util/content'
import get from 'lodash-es/get.js'
import {type MouseEvent, type ReactNode, useCallback, useMemo, useRef, useState} from 'react'
import {
  type ArrayOfObjectsInputProps,
  type ImageValue,
  insert,
  type ObjectSchemaType,
  PatchEvent,
  set,
  setIfMissing,
  useClient,
  useFormValue,
  useResolveInitialValueForType,
} from 'sanity'

import Feedback from './Feedback'
import {type ImageHotspotOptions} from './plugin'
import Spot from './Spot'
import {useDebouncedCallback} from './useDebouncedCallback'
import {useResizeObserver} from './useResizeObserver'

const imageStyle = {width: `100%`, height: `auto`}

const VALID_ROOT_PATHS = ['document', 'parent']

export type FnHotspotMove = (key: string, x: number, y: number) => void

export type HotspotItem<HotspotFields = {[key: string]: unknown}> = {
  _key: string
  _type: string
  x: number
  y: number
} & HotspotFields

export function ImageHotspotArray(
  props: ArrayOfObjectsInputProps<HotspotItem> & {imageHotspotOptions: ImageHotspotOptions},
): ReactNode {
  const {value, onChange, imageHotspotOptions, schemaType, renderPreview} = props

  const sanityClient = useClient({apiVersion: '2022-01-01'})

  const imageHotspotPathRoot = useMemo(() => {
    const pathRoot = VALID_ROOT_PATHS.includes(imageHotspotOptions.pathRoot ?? '')
      ? imageHotspotOptions.pathRoot
      : 'document'
    return pathRoot === 'document' ? [] : props.path.slice(0, -1)
  }, [imageHotspotOptions.pathRoot, props.path])

  const rootObject = useFormValue(imageHotspotPathRoot)

  const resolveInitialValueForType = useResolveInitialValueForType()
  const resolveInitialValue = useCallback(
    async (type: ObjectSchemaType) => {
      return resolveInitialValueForType(type, {})
        .then((initialValue) => {
          return initialValue
        })
        .catch(() => {
          return undefined
        })
    },
    [resolveInitialValueForType],
  )

  /**
   * Finding the image from the imageHotspotPathRoot (defaults to document),
   * using the path from the hotspot's `options` field
   *
   * when changes in imageHotspotPathRoot (e.g. document) occur,
   * check if there are any changes to the hotspotImage and update the reference
   */
  const hotspotImage = useMemo(() => {
    // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- the configured imagePath is expected to point to an image field
    return (
      imageHotspotOptions.imagePath ? get(rootObject, imageHotspotOptions.imagePath) : rootObject
    ) as ImageValue | undefined
  }, [rootObject, imageHotspotOptions.imagePath])

  const displayImage = useMemo(() => {
    const builder = createImageUrlBuilder(sanityClient).dataset(sanityClient.config().dataset ?? '')
    const urlFor = (source: ImageValue) => builder.image(source)

    if (hotspotImage?.asset?._ref) {
      const {aspectRatio} = getImageDimensions(hotspotImage.asset._ref)
      const width = 1200
      const height = Math.round(width / aspectRatio)
      const url = urlFor(hotspotImage).width(width).url()

      return {width, height, url}
    }

    return null
  }, [hotspotImage, sanityClient])

  const handleHotspotImageClick = useCallback(
    async (event: MouseEvent<HTMLImageElement>) => {
      const spotType = schemaType.of[0]
      if (!spotType) {
        return
      }

      const {nativeEvent, currentTarget} = event

      // Calculate the x/y percentage of the click position
      const x = Number(((nativeEvent.offsetX * 100) / currentTarget.width).toFixed(2))
      const y = Number(((nativeEvent.offsetY * 100) / currentTarget.height).toFixed(2))
      const description = `New Hotspot at ${x}% x ${y}%`

      // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- hotspot arrays contain a single object type
      const initialValues = await resolveInitialValue(spotType.type as ObjectSchemaType)

      const newRow: HotspotItem = {
        _key: randomKey(12),
        _type: spotType.name,
        ...initialValues,
        x,
        y,
      }

      if (imageHotspotOptions?.descriptionPath) {
        newRow[imageHotspotOptions.descriptionPath] = description
      }

      onChange(PatchEvent.from([setIfMissing([]), insert([newRow], 'after', [-1])]))
    },
    [imageHotspotOptions, onChange, resolveInitialValue, schemaType],
  )

  const handleHotspotMove: FnHotspotMove = useCallback(
    (key, x, y) => {
      onChange(
        PatchEvent.from([
          // Set the `x` value of this array key item
          set(x, [{_key: key}, 'x']),
          // Set the `y` value of this array key item
          set(y, [{_key: key}, 'y']),
        ]),
      )
    },
    [onChange],
  )

  const hotspotImageRef = useRef<HTMLImageElement | null>(null)

  const [imageRect, setImageRect] = useState<DOMRectReadOnly>()

  useResizeObserver<HTMLImageElement>(
    hotspotImageRef,
    useDebouncedCallback(
      (e: ResizeObserverEntry) => setImageRect(e.contentRect),
      [setImageRect],
      200,
    ),
  )

  return (
    <Stack gap={[2, 2, 3]}>
      {displayImage?.url ? (
        <div style={{position: `relative`}}>
          {imageRect &&
            (value?.length ?? 0) > 0 &&
            value?.map((spot, index) => (
              <Spot
                index={index}
                key={spot._key}
                value={spot}
                bounds={imageRect}
                update={handleHotspotMove}
                hotspotDescriptionPath={imageHotspotOptions?.descriptionPath}
                tooltip={imageHotspotOptions?.tooltip}
                renderPreview={renderPreview}
                // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- hotspot arrays contain a single object type
                schemaType={schemaType.of[0] as ObjectSchemaType}
              />
            ))}

          <Card __unstable_checkered shadow={1}>
            <Flex align="center" justify="center">
              {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events -- hotspots are placed via pointer coordinates, which have no keyboard equivalent */}
              <img
                ref={hotspotImageRef}
                src={displayImage.url}
                width={displayImage.width}
                height={displayImage.height}
                alt=""
                style={imageStyle}
                onClick={handleHotspotImageClick}
              />
            </Flex>
          </Card>
        </div>
      ) : (
        <Feedback>
          {imageHotspotOptions.imagePath ? (
            <>
              No Hotspot image found at path <code>{imageHotspotOptions.imagePath}</code>
            </>
          ) : (
            <>
              Define a path in this field using to the image field in this document at{' '}
              <code>options.hotspotImagePath</code>
            </>
          )}
        </Feedback>
      )}
      {imageHotspotOptions.pathRoot && !VALID_ROOT_PATHS.includes(imageHotspotOptions.pathRoot) && (
        <Feedback>
          The supplied imageHotspotPathRoot &quot;{imageHotspotOptions.pathRoot}&quot; is not valid,
          falling back to &quot;document&quot;. Available values are &quot;
          {VALID_ROOT_PATHS.join(', ')}&quot;.
        </Feedback>
      )}
      {/* oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- renderDefault expects the base input props */}
      {props.renderDefault(props as unknown as ArrayOfObjectsInputProps)}
    </Stack>
  )
}
