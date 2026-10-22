import {screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'

import {renderWithMedia} from '../../__tests__/fixtures/renderWithMedia'
import UploadDropzone from './index'

const fileInput = (container: HTMLElement) =>
  container.querySelector<HTMLInputElement>('input[type="file"]')!

const photo = () => new File(['image'], 'photo.png', {type: 'image/png'})

describe('UploadDropzone', () => {
  it('uploads picked files', async () => {
    const user = userEvent.setup()
    const {actors, container} = await renderWithMedia(
      <UploadDropzone>
        <div />
      </UploadDropzone>,
    )
    const send = vi.spyOn(actors.media, 'send')
    const file = photo()

    await user.upload(fileInput(container), file)

    await waitFor(() => expect(send).toHaveBeenCalledWith({type: 'uploads.add', files: [file]}))
  })

  it('only accepts images when browsing images', async () => {
    const {container} = await renderWithMedia(
      <UploadDropzone>
        <div />
      </UploadDropzone>,
      {assetTypes: ['image']},
    )

    expect(fileInput(container)).toHaveAttribute('accept', 'image/*')
  })

  it('rejects files over the maximum upload size', async () => {
    const user = userEvent.setup()
    const {actors, container} = await renderWithMedia(
      <UploadDropzone>
        <div />
      </UploadDropzone>,
      {toolOptions: {maximumUploadSize: 1}},
    )
    const send = vi.spyOn(actors.media, 'send')

    await user.upload(fileInput(container), photo())

    expect(
      await screen.findByText('One or more files exceed the maximum upload size.'),
    ).toBeInTheDocument()
    expect(send).not.toHaveBeenCalledWith(expect.objectContaining({type: 'uploads.add'}))
  })

  it('ignores files when direct uploads are turned off', async () => {
    const user = userEvent.setup()
    const {actors, container} = await renderWithMedia(
      <UploadDropzone>
        <div />
      </UploadDropzone>,
      {toolOptions: {directUploads: false}},
    )
    const send = vi.spyOn(actors.media, 'send')

    expect(fileInput(container)).toBeInTheDocument()
    await user.upload(fileInput(container), photo())

    expect(send).not.toHaveBeenCalled()
  })
})
