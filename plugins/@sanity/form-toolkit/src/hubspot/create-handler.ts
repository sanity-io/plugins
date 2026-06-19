import createHandler from '../shared/create-handler'
import {fetchHubSpotData} from './fetch-hubspot-data'

export const hubSpotHandler = ({token}: {token: string}) => {
  return createHandler(() => fetchHubSpotData({token}))
}
