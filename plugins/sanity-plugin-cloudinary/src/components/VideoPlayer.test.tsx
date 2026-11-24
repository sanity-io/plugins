import {renderToStaticMarkup} from 'react-dom/server'
import {expect, test} from 'vitest'

import VideoPlayer from './VideoPlayer'

const src = 'https://res.cloudinary.com/demo/video/upload/v1/clip.mp4'

test('renders the same player as before when no preview options are passed', () => {
  expect(renderToStaticMarkup(<VideoPlayer src={src} kind="player" />)).toBe(
    `<video controls="" aria-label="Cloudinary video preview" style="width:100%;height:auto"><source src="${src}" type="video/mp4"/></video>`,
  )
})

test('lists the fallback as a second source and passes preload and poster through', () => {
  const markup = renderToStaticMarkup(
    <VideoPlayer
      src="https://res.cloudinary.com/demo/video/upload/q_auto/v1/clip.mp4"
      fallbackSrc={src}
      poster="https://res.cloudinary.com/demo/video/upload/so_0/v1/clip.jpg"
      preload="none"
      kind="player"
    />,
  )

  expect(markup).toContain('preload="none"')
  expect(markup).toContain('poster="https://res.cloudinary.com/demo/video/upload/so_0/v1/clip.jpg"')
  expect(markup).toMatch(/<source src="[^"]*q_auto[^"]*"[^>]*\/><source src="[^"]*v1\/clip.mp4"/)
})
