import {EditIcon, TrashIcon} from '@sanity/icons'
import {Box, Button, Dialog, Grid, Stack} from '@sanity/ui'
import {APIProvider, createStaticMapsUrl} from '@vis.gl/react-google-maps'
import {useCallback, useEffect, useId, useRef, useState} from 'react'
import {type ObjectInputProps, set, setIfMissing, unset, ChangeIndicator, type Path} from 'sanity'

import {MapApiGate} from '../map/MapApiGate'
import type {Geopoint, GeopointSchemaType, GoogleMapsInputConfig, LatLng} from '../types'
import {MissingApiKeyCard} from './ApiKeyMessages'
import {DialogInnerContainer} from './GeopointInput.styles'
import {GeopointSelect} from './GeopointSelect'
import {StaticMapPreview} from './StaticMapPreview'

const EMPTY_PATH: Path = []

const getStaticImageUrl = (value: LatLng, apiKey: string) =>
  createStaticMapsUrl({
    apiKey,
    width: 640,
    height: 300,
    scale: 2,
    zoom: 13,
    center: {lat: value.lat, lng: value.lng},
    markers: [{location: {lat: value.lat, lng: value.lng}}],
  })

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
    (latLng: LatLng) => {
      onChange([
        setIfMissing({_type: schemaTypeName}),
        set(latLng.lat, ['lat']),
        set(latLng.lng, ['lng']),
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
    return <MissingApiKeyCard typeTitle="Geopoint" />
  }

  const staticImageUrl = value ? getStaticImageUrl(value, config.apiKey) : null

  return (
    <Stack space={3}>
      {value && staticImageUrl && (
        <ChangeIndicator path={path} isChanged={changed} hasFocus={!!focused}>
          <StaticMapPreview
            key={staticImageUrl}
            url={staticImageUrl}
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
            <APIProvider apiKey={config.apiKey}>
              <MapApiGate>
                <GeopointSelect
                  value={value || undefined}
                  onChange={readOnly ? undefined : handleChange}
                  defaultLocation={config.defaultLocation}
                  defaultZoom={config.defaultZoom}
                />
              </MapApiGate>
            </APIProvider>
          </DialogInnerContainer>
        </Dialog>
      )}
    </Stack>
  )
}
