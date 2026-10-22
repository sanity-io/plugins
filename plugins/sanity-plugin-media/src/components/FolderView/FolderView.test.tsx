import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it} from 'vitest'

import FolderView from '.'
import {createMediaFetchMock} from '../../__tests__/fixtures/mediaFetchMock'
import {renderWithMedia} from '../../__tests__/fixtures/renderWithMedia'

const folders = [{_id: 'f1', name: 'Campaigns', parentId: null}]

describe('FolderView', () => {
  it('lists the folders', async () => {
    await renderWithMedia(<FolderView />, {folders})

    expect(screen.getByText('Campaigns')).toBeInTheDocument()
    expect(screen.queryByText('No folders')).not.toBeInTheDocument()
  })

  it('tells when there are no folders', async () => {
    await renderWithMedia(<FolderView />)

    expect(screen.getByText('No folders')).toBeInTheDocument()
  })

  it('tells nothing about folders while they load', async () => {
    await renderWithMedia(<FolderView />, {pending: ['folders']})

    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.queryByText('No folders')).not.toBeInTheDocument()
  })

  it('offers to load folders again when they failed to load', async () => {
    const user = userEvent.setup()
    const {client} = await renderWithMedia(<FolderView />, {
      errors: {folders: {message: 'Query timed out', statusCode: 504}},
    })
    expect(screen.getByText('Unable to load folders')).toBeInTheDocument()
    expect(screen.queryByText('No folders')).not.toBeInTheDocument()
    client.fetch.mockImplementation(createMediaFetchMock({folders}))

    await user.click(screen.getByRole('button', {name: 'Retry'}))

    expect(await screen.findByText('Campaigns')).toBeInTheDocument()
    expect(screen.queryByText('Unable to load folders')).not.toBeInTheDocument()
  })
})
