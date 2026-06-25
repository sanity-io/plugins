import {styled} from 'styled-components'

export const MapDiffImage = styled.div`
  & img {
    display: block;
    width: 100%;
    height: auto;
    object-fit: contain;
    vertical-align: top;
  }
`

export const MapDiffPlaceholder = styled.div`
  width: 100%;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
`
