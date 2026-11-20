import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {
  BufferingIndicator,
  Container,
  Controls,
  ErrorDialog,
  Gesture,
  Hotkey,
  MuteButton,
  PlayButton,
  Poster,
  Slider,
  StatusAnnouncer,
  Time,
  TimeSlider,
  VolumePopover,
  VolumeSlider,
} from '@videojs/react'
import {PauseIcon, PlayIcon, SpinnerIcon, VolumeHighIcon, VolumeOffIcon} from '@videojs/react/icons'
import type {CSSProperties, ReactNode} from 'react'
import {styled} from 'styled-components'

import {AudioIcon} from './icons/Audio'

const Root = styled(Container)`
  position: relative;
  display: block;
  overflow: hidden;
  border-radius: 0.1875rem;
  background: black;
  color: white;

  video {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`

const PosterRoot = styled(Poster.Root)`
  position: absolute;
  inset: 0;
  pointer-events: none;

  &:not([data-visible]) {
    display: none;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`

const Spinner = styled(BufferingIndicator)`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;

  &:not([data-visible]) {
    display: none;
  }

  svg {
    width: 1.5rem;
    height: 1.5rem;
  }
`

const Bar = styled(Controls.Content)`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.25rem;
  color: white;
`

const OverlayBar = styled(Bar)`
  position: absolute;
  inset: auto 0 0;
  background: linear-gradient(to top, rgb(0 0 0 / 0.6), transparent);
  transition: opacity 0.2s;

  &:not([data-visible]):not(:has(:focus-visible)) {
    opacity: 0;
  }
`

const AudioRoot = styled(Container)`
  position: relative;
  display: block;
  overflow: hidden;
  border-radius: 0.1875rem;
  color: white;
`

const AudioBar = styled(Bar)`
  position: absolute;
  inset: auto 0 0;
  background: rgb(0 0 0 / 0.6);
`

const ArtworkRoot = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;

  svg {
    width: auto;
    height: 45%;
  }
`

const IconButton = styled.button`
  display: grid;
  place-items: center;
  flex: none;
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: inherit;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid currentColor;
  }

  svg {
    width: 0.875rem;
    height: 0.875rem;
  }
`

const CurrentTime = styled(Time.Value)`
  flex: none;
  padding-inline: 0.125rem;
  font-size: 0.6875rem;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  cursor: pointer;
  border-radius: 0.125rem;

  &:focus-visible {
    outline: 2px solid currentColor;
  }
`

const Timeline = styled(TimeSlider.Root)`
  position: relative;
  display: flex;
  flex: 1;
  align-items: center;
  height: 1.5rem;
  cursor: pointer;
`

const Track = styled(TimeSlider.Track)`
  position: relative;
  width: 100%;
  height: 3px;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.3);
  overflow: hidden;
  transition: height 0.1s;
`

const ChapterList = styled(TimeSlider.Chapters)`
  position: absolute;
  inset: 0;
`

// Every chapter draws the whole track and is clipped to its own range, leaving a 2px gap
// between neighbours. Without chapter cues there is a single range spanning the slider.
const Chapter = styled.div`
  --gap-start: 1px;
  --gap-end: 1px;
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  clip-path: inset(
    0 calc(100% - var(--media-slider-chapter-end) + var(--gap-end)) 0
      calc(var(--media-slider-chapter-start) + var(--gap-start))
  );

  &:first-of-type {
    --gap-start: 0px;
  }

  &:last-of-type {
    --gap-end: 0px;
  }

  &[data-highlighted] ${Track} {
    height: 5px;
  }
`

const Buffer = styled(TimeSlider.Buffer)`
  position: absolute;
  inset: 0 auto 0 0;
  width: var(--media-slider-buffer, 0%);
  background: rgb(255 255 255 / 0.3);
`

const Fill = styled(TimeSlider.Fill)`
  position: absolute;
  inset: 0 auto 0 0;
  width: var(--media-slider-fill, 0%);
  background: currentColor;
`

// Follows the pointer with the storyboard thumbnail, the hovered chapter's title and the time
// at that point, on the same frosted surface as the Video.js skin's popups. The thumbnail
// fills the preview and the text sits over its bottom edge.
const PointerPreview = styled(TimeSlider.Preview)`
  bottom: calc(100% + 0.25rem);
  display: grid;
  max-width: 100%;
  overflow: hidden;
  border-radius: 0.5rem;
  background-color: oklch(0.3 0 0 / 0.6);
  backdrop-filter: blur(16px) saturate(1.25);
  box-shadow:
    0 0 0 1px oklch(0 0 0 / 0.1),
    0 1px 3px 0 oklch(0 0 0 / 0.15);
  font-size: 0.6875rem;
  line-height: 1.3;
  opacity: 0;
  transition: opacity 0.1s;

  & > * {
    grid-area: 1 / 1;
  }

  &[data-pointing] {
    opacity: 1;
  }
`

// Video.js sizes the storyboard tile to fit these bounds.
const PointerThumbnail = styled(Slider.Thumbnail.Root)`
  max-width: 7.5rem;
  max-height: 4.25rem;

  &[data-hidden] {
    display: none;
  }
`

// Over a thumbnail the text takes no width of its own, so the thumbnail sets the preview's
// width and a long title is truncated instead of widening it.
const PreviewText = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  align-self: end;
  box-sizing: border-box;
  max-width: 100%;
  padding: 0.25rem 0.5rem;

  ${PointerThumbnail}:not([data-hidden]) ~ & {
    width: 0;
    min-width: 100%;
    padding-top: 0.75rem;
    background: linear-gradient(to top, rgb(0 0 0 / 0.75), transparent);
    text-shadow: 0 1px 2px rgb(0 0 0 / 0.6);
  }
`

const ChapterTitle = styled(TimeSlider.ChapterTitle)`
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:empty {
    display: none;
  }
`

const PointerTime = styled(TimeSlider.Value)`
  font-weight: 600;
  font-variant-numeric: tabular-nums;
`

const Thumb = styled(TimeSlider.Thumb)`
  position: absolute;
  left: var(--media-slider-fill, 0%);
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 999px;
  background: currentColor;
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity 0.1s;

  ${Timeline}:hover &,
  ${Timeline}[data-dragging] &,
  &:focus-visible {
    opacity: 1;
  }
`

// Opens above the mute button on hover, in the browser's top layer, so it can extend past
// the card.
const VolumePopup = styled(VolumePopover.Popup)`
  margin: 0;
  padding: 0.5rem 0.25rem;
  border: 0;
  border-radius: 999px;
  overflow: visible;
  background-color: oklch(0.3 0 0 / 0.6);
  backdrop-filter: blur(16px) saturate(1.25);
  box-shadow:
    0 0 0 1px oklch(0 0 0 / 0.1),
    0 1px 3px 0 oklch(0 0 0 / 0.15);
  color: white;
`

const Volume = styled(VolumeSlider.Root)`
  position: relative;
  display: flex;
  justify-content: center;
  width: 1rem;
  height: 4rem;
  cursor: pointer;
`

const VolumeTrack = styled(VolumeSlider.Track)`
  position: relative;
  width: 3px;
  height: 100%;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.3);
  overflow: hidden;
`

const VolumeFill = styled(VolumeSlider.Fill)`
  position: absolute;
  inset: auto 0 0;
  height: var(--media-slider-fill, 0%);
  background: currentColor;
`

const VolumeThumb = styled(VolumeSlider.Thumb)`
  position: absolute;
  bottom: var(--media-slider-fill, 0%);
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 999px;
  background: currentColor;
  transform: translateY(50%);

  &:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }
`

// Announces playback changes to screen readers without showing them.
const Announcer = styled(StatusAnnouncer)`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
`

// Covers the player while it has an error, with the localized title and description from
// Video.js and a button that dismisses it.
const ErrorOverlay = styled(ErrorDialog.Popup)`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.5rem;
  background: rgb(0 0 0 / 0.8);
  color: white;
  font-size: 0.6875rem;
  line-height: 1.3;
  text-align: center;
  outline: none;
`

const ErrorHeading = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;

  svg {
    flex: none;
    width: 1rem;
    height: 1rem;
  }
`

const ErrorTitle = styled(ErrorDialog.Title)`
  margin: 0;
  font-size: 0.75rem;
  font-weight: 600;
`

const ErrorDescription = styled(ErrorDialog.Description)`
  display: -webkit-box;
  flex: none;
  margin: 0;
  overflow: hidden;
  opacity: 0.8;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
`

const ErrorClose = styled(ErrorDialog.Close)`
  flex: none;
  margin-top: 0.125rem;
  padding: 0.125rem 0.625rem;
  border: 0;
  border-radius: 999px;
  background-color: oklch(0.4 0 0 / 0.7);
  color: inherit;
  font: inherit;
  cursor: pointer;

  &:hover {
    background-color: oklch(0.5 0 0 / 0.7);
  }

  &:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }
`

function PreviewError() {
  return (
    <ErrorDialog.Root>
      <ErrorOverlay>
        <ErrorHeading>
          <ErrorOutlineIcon aria-hidden />
          <ErrorTitle />
        </ErrorHeading>
        <ErrorDescription />
        <ErrorClose />
      </ErrorOverlay>
    </ErrorDialog.Root>
  )
}

function PreviewControls({as}: {as: typeof Bar}) {
  const Content = as
  return (
    <Content>
      <PlayButton
        render={(props, state) => (
          <IconButton {...props}>{state.paused ? <PlayIcon /> : <PauseIcon />}</IconButton>
        )}
      />
      <CurrentTime type="current" toggle />
      <Timeline>
        <ChapterList
          renderChapter={(props) => (
            <Chapter {...props}>
              <Track>
                <Buffer />
                <Fill />
              </Track>
            </Chapter>
          )}
        />
        <Thumb />
        <PointerPreview>
          <PointerThumbnail>
            <Slider.Thumbnail.Image />
          </PointerThumbnail>
          <PreviewText>
            <ChapterTitle />
            <PointerTime type="pointer" />
          </PreviewText>
        </PointerPreview>
      </Timeline>
      <VolumePopover.Root openOnHover delay={200} closeDelay={100} side="top">
        <VolumePopover.Trigger
          render={
            <MuteButton
              render={(props, state) => (
                <IconButton {...props}>
                  {state.muted ? <VolumeOffIcon /> : <VolumeHighIcon />}
                </IconButton>
              )}
            />
          }
        />
        <VolumePopup>
          <Volume orientation="vertical" thumbAlignment="edge">
            <VolumeTrack>
              <VolumeFill />
            </VolumeTrack>
            <VolumeThumb />
          </Volume>
        </VolumePopup>
      </VolumePopover.Root>
    </Content>
  )
}

interface PreviewSkinProps {
  children: ReactNode
  style?: CSSProperties | undefined
}

/**
 * Minimal skins for small previews, such as the cards in the Videos tool: play/pause,
 * a thin timeline and mute, so the controls don't cover the media. Playback errors cover the
 * player until dismissed.
 */
export function PreviewVideoSkin({children, style}: PreviewSkinProps) {
  return (
    <Root style={style}>
      {children}
      <PosterRoot>
        <Poster.Image alt="" />
      </PosterRoot>
      <Spinner>
        <SpinnerIcon />
      </Spinner>

      <Controls.Root>
        <PreviewControls as={OverlayBar} />
      </Controls.Root>

      <Gesture type="tap" action="togglePaused" pointer="mouse" />
      <Gesture type="tap" action="toggleControls" pointer="touch" />
      <Hotkey keys="Space" action="togglePaused" />
      <Hotkey keys="m" action="toggleMuted" />
      <PreviewError />
      <Announcer />
    </Root>
  )
}

/** Audio file icon centered in its container, standing in for a poster on audio cards. */
export function AudioArtwork() {
  return (
    <ArtworkRoot>
      <AudioIcon aria-hidden />
    </ArtworkRoot>
  )
}

export function PreviewAudioSkin({children, style}: PreviewSkinProps) {
  return (
    <AudioRoot style={style}>
      {children}
      <AudioArtwork />
      <Controls.Root visibility="always">
        <PreviewControls as={AudioBar} />
      </Controls.Root>

      <Gesture type="tap" action="togglePaused" pointer="mouse" />
      <Hotkey keys="Space" action="togglePaused" />
      <Hotkey keys="m" action="toggleMuted" />
      <PreviewError />
      <Announcer />
    </AudioRoot>
  )
}
