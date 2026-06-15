import React, {useCallback, useEffect, useId, useRef, useState} from 'react'
import {Box, Button, Dialog, Grid, Stack, TextInput, Label} from '@sanity/ui'
import {EditIcon, TrashIcon} from '@sanity/icons'
import {ObjectInputProps, set, setIfMissing, unset, ChangeIndicator, Path} from 'sanity'
import {GoogleMapsLoadProxy} from '../loader/GoogleMapsLoadProxy'
import type {
  GeopointRadius,
  GeopointRadiusSchemaType,
  GoogleMapsInputConfig,
  LatLng,
} from '../types'
import {getGeoConfig} from '../global-workaround'
import {DialogInnerContainer, PreviewImage} from './GeopointInput.styles'
import {GeopointRadiusSelect} from './GeopointRadiusSelect'

const EMPTY_PATH: Path = []

// Helper function to generate circle points
const generateCirclePoints = (
  lat: number,
  lng: number,
  radius: number,
): Array<{lat: number; lng: number}> => {
  const points = []
  const steps = 32 // Number of points to create the circle

  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI
    const latOffset = (radius / 111000) * Math.cos(angle) // Rough conversion to degrees
    const lngOffset = (radius / (111000 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle)

    points.push({
      lat: lat + latOffset,
      lng: lng + lngOffset,
    })
  }

  return points
}

const getStaticImageUrl = (value: LatLng & {radius?: number}, apiKey: string) => {
  const loc = `${value.lat},${value.lng}`

  // Calculate appropriate zoom level based on radius
  let zoom = 13
  if (value.radius) {
    // Use logarithmic formula for better zoom calculation
    // Add padding to ensure circle is fully visible
    const radius = value.radius + value.radius / 2
    const scale = radius / 500
    const calculatedZoom = 16 - Math.log(scale) / Math.log(2)
    // Add small offset to ensure circle fits well in view
    zoom = Math.max(8, Math.min(16, Math.round(calculatedZoom - 0.4)))
  }

  const qs = new URLSearchParams({
    key: apiKey,
    center: loc,
    markers: loc,
    zoom: zoom.toString(),
    scale: '2',
    size: '640x300',
  })

  // Add circle if radius is present
  if (value.radius) {
    // Create a circle path using multiple points
    const points = generateCirclePoints(value.lat, value.lng, value.radius)
    const path = points.map((p) => `${p.lat},${p.lng}`).join('|')
    qs.append('path', `fillcolor:0x4285F480|color:0x4285F4|weight:2|${path}`)
  }

  return `https://maps.googleapis.com/maps/api/staticmap?${qs.toString()}`
}

export type GeopointRadiusInputProps = ObjectInputProps<
  GeopointRadius,
  GeopointRadiusSchemaType
> & {
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
    (latLng: google.maps.LatLng, radius?: number) => {
      const currentRadius = radius ?? value?.radius ?? config.defaultRadius ?? 1000
      onChange([
        setIfMissing({_type: schemaTypeName}),
        set(latLng.lat(), ['lat']),
        set(latLng.lng(), ['lng']),
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
    return (
      <div>
        <p>
          The <a href="https://sanity.io/docs/schema-types/geopoint-type">Geopoint Radius type</a>{' '}
          needs a Google Maps API key with access to:
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
            alt="Map location with radius"
            onClick={handleFocusButton}
            onDoubleClick={handleToggleModal}
          />
        </ChangeIndicator>
      )}

      {value && (
        <Stack space={2}>
          <Label>Radius (meters)</Label>
          <TextInput
            type="number"
            value={Math.round(value.radius || config.defaultRadius || 1000)}
            onChange={handleRadiusChange}
            disabled={readOnly}
            min={1}
            max={50000}
            step={1}
          />
        </Stack>
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
            text={value ? 'Edit' : 'Set location and radius'}
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
          header="Place the marker and set radius on the map"
          id={`${dialogId}_dialog`}
          onBlur={handleBlur}
          onClose={handleCloseModal}
          ref={dialogRef}
          width={1}
        >
          <DialogInnerContainer>
            <GoogleMapsLoadProxy config={getGeoConfig()}>
              {(api) => (
                <GeopointRadiusSelect
                  api={api}
                  value={value || undefined}
                  onChange={readOnly ? undefined : handleChange}
                  defaultLocation={config.defaultLocation}
                  defaultRadiusZoom={config.defaultRadiusZoom}
                  defaultRadius={config.defaultRadius}
                />
              )}
            </GoogleMapsLoadProxy>
          </DialogInnerContainer>
        </Dialog>
      )}
    </Stack>
  )
}
