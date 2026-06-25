import {EditIcon, TrashIcon} from '@sanity/icons'
import {Box, Button, Dialog, Grid, Stack} from '@sanity/ui'
import {APIProvider} from '@vis.gl/react-google-maps'
import {useCallback, useEffect, useId, useRef, useState} from 'react'
import {type ObjectInputProps, set, setIfMissing, unset, ChangeIndicator, type Path} from 'sanity'

import {MapApiGate} from '../map/MapApiGate'
import {getGeopointStaticMapUrl} from '../map/staticMapUrl'
import type {Geopoint, GoogleMapsInputConfig, LatLng} from '../types'
import {getValidLatLng} from '../utils'
import {MissingApiKeyCard} from './ApiKeyMessages'
import {DialogInnerContainer} from './GeopointInput.styles'
import {GeopointSelect} from './GeopointSelect'
import {StaticMapPreview} from './StaticMapPreview'

const EMPTY_PATH: Path = []

export type GeopointInputProps = ObjectInputProps<Geopoint> & {
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

  // A geopoint is only renderable on a map once it has finite coordinates. A
  // freshly added array item is `{_type, _key}` with no lat/lng yet, so gate the
  // map preview and "edit" affordances on having a real location.
  const position = getValidLatLng(value)
  const staticImageUrl = position ? getGeopointStaticMapUrl(position, config.apiKey) : null

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
            text={position ? 'Edit' : 'Set location'}
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
