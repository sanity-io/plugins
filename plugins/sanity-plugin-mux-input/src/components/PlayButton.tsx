import {styled} from 'styled-components'

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
    background: var(--card-fg-color);
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
    transition: 0.15s 0.05s ease-out;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    color: var(--card-fg-color);
    background: var(--card-bg-color);
    width: auto;
    height: 30%;
    aspect-ratio: 1;
    border-radius: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
    > svg {
      display: block;
      width: 70%;
      height: auto;
      // Visual balance to center-align the icon
      transform: translateX(5%);
    }
  }

  &:hover,
  &:focus {
    &::after {
      opacity: 0.3;
    }
    > div[data-play] {
      opacity: 1;
    }
  }
`
