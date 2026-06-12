type HubSpotForm = {
  id: string
  name: string
  [key: string]: unknown // Additional properties from the API response
}

type MappedResult = HubSpotForm & {
  value: string
}
export async function fetchHubSpotData({token}: {token: string}): Promise<MappedResult[] | null> {
  try {
    const apiResponse = await fetch('https://api.hubapi.com/marketing/v3/forms/?limit=9999', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!apiResponse.ok) {
      console.error(`Failed to fetch data: ${apiResponse.statusText}`)
      return null
    }

    const {results}: {results: HubSpotForm[]} = await apiResponse.json()

    return results.map((result) => ({
      ...result,
      value: result.id,
    }))
  } catch (e: unknown) {
    console.error(e)
    return null // Explicitly return null on error
  }
}
