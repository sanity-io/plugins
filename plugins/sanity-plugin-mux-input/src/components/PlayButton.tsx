import {styled} from 'styled-components'

/**
 * Poster button shown before a player mounts. The `[data-play]` badge matches the frosted
 * control surface of the Video.js skin, tinted to stay legible on light posters.
 */
export const PlayButton = styled.button`
  display: block;
  padding: 0;
  margin: 0;
  border: none;
  border-radius: 0.1875rem;
  position: relative;
  cursor: pointer;

  &::after {
    content: '';
    background: black;
    opacity: 0;
    display: block;
    position: absolute;
    inset: 0;
    z-index: 10;
    transition: 0.15s ease-out;
    border-radius: inherit;
  }

  > div[data-play] {
    z-index: 11;
    opacity: 0;
    scale: 0.9;
    transition-property: opacity, scale, background-color;
    transition-duration: 0.15s;
    transition-timing-function: cubic-bezier(0, 0, 0.2, 1);
    position: absolute;
    left: 50%;
    top: 50%;
    translate: -50% -50%;
    display: flex;
    padding: 0.8125rem;
    border-radius: 9999px;
    background-color: oklch(0.3 0 0 / 0.6);
    backdrop-filter: blur(16px) saturate(1.25);
    box-shadow:
      0 0 0 1px oklch(0 0 0 / 0.1),
      0 1px 3px 0 oklch(0 0 0 / 0.15),
      0 1px 2px -1px oklch(0 0 0 / 0.15);
    color: #fff;

    > svg {
      display: block;
      width: 1.125rem;
      height: 1.125rem;
    }
  }

  &:hover,
  &:focus-visible {
    &::after {
      opacity: 0.3;
    }
    > div[data-play] {
      opacity: 1;
      scale: 1;
      background-color: oklch(0.4 0 0 / 0.7);
    }
  }

  &:focus-visible {
    outline: 2px solid var(--card-focus-ring-color);
    outline-offset: 2px;
  }
`
