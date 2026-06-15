import {useCallback, useEffect, useId, useRef, useState} from 'react'
import {Box, Button, Dialog, Grid, Stack} from '@sanity/ui'
import {EditIcon, TrashIcon} from '@sanity/icons'
import {ObjectInputProps, set, setIfMissing, unset, ChangeIndicator, Path} from 'sanity'
import {GoogleMapsLoadProxy} from '../loader/GoogleMapsLoadProxy'
import type {Geopoint, GeopointSchemaType, GoogleMapsInputConfig, LatLng} from '../types'
import {getGeoConfig} from '../global-workaround'
import {DialogInnerContainer, PreviewImage} from './GeopointInput.styles'
import {GeopointSelect} from './GeopointSelect'

const EMPTY_PATH: Path = []

const getStaticImageUrl = (value: LatLng, apiKey: string) => {
  const loc = `${value.lat},${value.lng}`
  const qs = new URLSearchParams({
    key: apiKey,
    center: loc,
    markers: loc,
    zoom: '13',
    scale: '2',
    size: '640x300',
  })

  return `https://maps.googleapis.com/maps/api/staticmap?${qs.toString()}`
}

export type GeopointInputProps = ObjectInputProps<Geopoint, GeopointSchemaType> & {
  geoConfig: GoogleMapsInputConfig
}

export function GeopointInput(props: GeopointInputProps) {
  const {
    changed,
    elementProps,
    focused,
    geoConfig: config,
    onChange,
    onPathFocus,
    path,
    readOnly,
    schemaType,
    value,
  } = props

  const {
    id,
    ref: inputRef,
    onBlur: handleBlur,
    onFocus: handleFocus,
    'aria-describedby': ariaDescribedBy,
  } = elementProps

  const schemaTypeName = schemaType.name
  const dialogId = useId()
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const handleFocusButton = useCallback(() => inputRef?.current?.focus(), [inputRef])
  const [modalOpen, setModalOpen] = useState(false)

  const handleCloseModal = useCallback(() => {
    if (dialogRef.current) dialogRef.current.blur()
    setModalOpen(false)
    handleFocusButton()
  }, [setModalOpen, handleFocusButton])

  const handleToggleModal = useCallback(
    () => setModalOpen((currentState) => !currentState),
    [setModalOpen],
  )

  const handleChange = useCallback(
    (latLng: google.maps.LatLng) => {
      onChange([
        setIfMissing({_type: schemaTypeName}),
        set(latLng.lat(), ['lat']),
        set(latLng.lng(), ['lng']),
      ])
    },
    [schemaTypeName, onChange],
  )

  const handleClear = useCallback(() => {
    onChange(unset())
  }, [onChange])

  useEffect(() => {
    if (modalOpen) {
      onPathFocus(EMPTY_PATH)
    }
  }, [modalOpen, onPathFocus])

  if (!config || !config.apiKey) {
    return (
      <div>
        <p>
          The <a href="https://sanity.io/docs/schema-types/geopoint-type">Geopoint type</a> needs a
          Google Maps API key with access to:
        </p>
        <ul>
          <li>Google Maps JavaScript API</li>
          <li>Google Places API Web Service</li>
          <li>Google Static Maps API</li>
        </ul>
        <p>
          Please enter the API key with access to these services in your googleMapsInput plugin
          config.
        </p>
      </div>
    )
  }

  return (
    <Stack space={3}>
      {value && (
        <ChangeIndicator path={path} isChanged={changed} hasFocus={!!focused}>
          <PreviewImage
            src={getStaticImageUrl(value, config.apiKey)}
            alt="Map location"
            onClick={handleFocusButton}
            onDoubleClick={handleToggleModal}
          />
        </ChangeIndicator>
      )}

      <Box>
        <Grid columns={value ? 2 : 1} gap={3}>
          <Button
            aria-describedby={ariaDescribedBy}
            disabled={readOnly}
            icon={value && EditIcon}
            id={id}
            mode="ghost"
            onClick={handleToggleModal}
            onFocus={handleFocus}
            padding={3}
            ref={inputRef}
            text={value ? 'Edit' : 'Set location'}
          />

          {value && (
            <Button
              disabled={readOnly}
              icon={TrashIcon}
              mode="ghost"
              onClick={handleClear}
              padding={3}
              text="Remove"
              tone="critical"
            />
          )}
        </Grid>
      </Box>

      {modalOpen && (
        <Dialog
          header="Place the marker on the map"
          id={`${dialogId}_dialog`}
          onBlur={handleBlur}
          onClose={handleCloseModal}
          ref={dialogRef}
          width={1}
        >
          <DialogInnerContainer>
            <GoogleMapsLoadProxy config={getGeoConfig()}>
              {(api) => (
                <GeopointSelect
                  api={api}
                  value={value || undefined}
                  onChange={readOnly ? undefined : handleChange}
                  defaultLocation={config.defaultLocation}
                  defaultZoom={config.defaultZoom}
                />
              )}
            </GoogleMapsLoadProxy>
          </DialogInnerContainer>
        </Dialog>
      )}
    </Stack>
  )
}
