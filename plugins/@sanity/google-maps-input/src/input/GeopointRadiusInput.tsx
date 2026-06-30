import {EditIcon, TrashIcon} from '@sanity/icons'
import {Box, Button, Dialog, Grid, Stack, TextInput, Label} from '@sanity/ui'
import {APIProvider} from '@vis.gl/react-google-maps'
import {useCallback, useEffect, useId, useRef, useState} from 'react'
import {type ObjectInputProps, set, setIfMissing, unset, ChangeIndicator, type Path} from 'sanity'

import {MapApiGate} from '../map/MapApiGate'
import {getGeopointRadiusStaticMapUrl} from '../map/staticMapUrl'
import type {GeopointRadius, GoogleMapsInputConfig, LatLng} from '../types'
import {getValidLatLng} from '../utils'
import {MissingApiKeyCard} from './ApiKeyMessages'
import {GeopointRadiusSelect} from './GeopointRadiusSelect'
import {StaticMapPreview} from './StaticMapPreview'

import {dialogInnerContainer} from './GeopointInput.css'

const EMPTY_PATH: Path = []

export type GeopointRadiusInputProps = ObjectInputProps<GeopointRadius> & {
  geoConfig: GoogleMapsInputConfig
}

export function GeopointRadiusInput(props: GeopointRadiusInputProps) {
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
    (latLng: LatLng, radius?: number) => {
      const currentRadius = radius ?? value?.radius ?? config.defaultRadius ?? 1000
      onChange([
        setIfMissing({_type: schemaTypeName}),
        set(latLng.lat, ['lat']),
        set(latLng.lng, ['lng']),
        set(currentRadius, ['radius']),
      ])
    },
    [schemaTypeName, onChange, value?.radius, config.defaultRadius],
  )

  const handleRadiusChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (value) {
        onChange([set(Math.round(Number(event.currentTarget.value)), ['radius'])])
      }
    },
    [onChange, value],
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
    return <MissingApiKeyCard typeTitle="Geopoint Radius" />
  }

  // A geopoint is only renderable on a map once it has finite coordinates. A
  // freshly added array item is `{_type, _key}` with no lat/lng yet, so gate the
  // map preview, radius control and "edit" affordances on having a real location.
  const position = getValidLatLng(value)
  const radius = Math.round(value?.radius || config.defaultRadius || 1000)
  const staticImageUrl = position
    ? getGeopointRadiusStaticMapUrl(
        {lat: position.lat, lng: position.lng, radius: value?.radius ?? 0},
        config.apiKey,
      )
    : null

  return (
    <Stack gap={3}>
      {staticImageUrl && (
        <ChangeIndicator path={path} isChanged={changed} hasFocus={!!focused}>
          <StaticMapPreview
            url={staticImageUrl}
            onClick={handleFocusButton}
            onDoubleClick={handleToggleModal}
          />
        </ChangeIndicator>
      )}

      {position && (
        <Stack gap={2}>
          <Label>Radius (meters)</Label>
          <TextInput
            type="number"
            value={radius}
            onChange={handleRadiusChange}
            disabled={readOnly}
            min={1}
            max={50000}
            step={1}
          />
        </Stack>
      )}

      <Box>
        <Grid gridTemplateColumns={position ? 2 : 1} gap={3}>
          <Button
            aria-describedby={ariaDescribedBy}
            disabled={readOnly}
            icon={position ? EditIcon : undefined}
            id={id}
            mode="ghost"
            onClick={handleToggleModal}
            onFocus={handleFocus}
            padding={3}
            ref={inputRef}
            text={position ? 'Edit' : 'Set location and radius'}
          />

          {position && (
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
          header="Place the marker and set radius on the map"
          id={`${dialogId}_dialog`}
          onBlur={handleBlur}
          onClose={handleCloseModal}
          ref={dialogRef}
          width={1}
        >
          <div className={dialogInnerContainer}>
            <APIProvider apiKey={config.apiKey}>
              <MapApiGate>
                <GeopointRadiusSelect
                  value={value || undefined}
                  onChange={readOnly ? undefined : handleChange}
                  defaultLocation={config.defaultLocation}
                  defaultRadiusZoom={config.defaultRadiusZoom}
                  defaultRadius={config.defaultRadius}
                />
              </MapApiGate>
            </APIProvider>
          </div>
        </Dialog>
      )}
    </Stack>
  )
}
