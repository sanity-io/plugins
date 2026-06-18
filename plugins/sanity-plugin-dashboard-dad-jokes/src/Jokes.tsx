import {DashboardWidgetContainer} from '@sanity/dashboard'
import {Button, Card, Code, Spinner, Text} from '@sanity/ui'
import {useEffect, useState} from 'react'

export default function Jokes() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | undefined>()
  const [joke, setJoke] = useState<string | undefined>()

  // Performs the request and only updates state from async callbacks, so it is
  // safe to call from an effect without triggering a synchronous setState.
  function loadJoke() {
    return fetch('https://icanhazdadjoke.com/', {headers: {Accept: 'application/json'}})
      .then((res) => res.json())
      .then((data) => setJoke(data.joke))
      .catch((e: Error) => setError(e))
      .finally(() => setIsLoading(false))
  }

  function getJoke() {
    setIsLoading(true)
    setError(undefined)
    void loadJoke()
  }

  useEffect(() => {
    void loadJoke()
  }, [])

  return (
    <DashboardWidgetContainer
      header="A dad joke"
      footer={<Button text="New joke" tone="primary" onClick={getJoke} disabled={isLoading} />}
    >
      {isLoading && (
        <Card paddingX={3} paddingY={4}>
          <Spinner />
        </Card>
      )}
      {error && !isLoading && (
        <Card paddingX={3} paddingY={4} tone="critical">
          <Code>{JSON.stringify(error, null, 2)}</Code>
        </Card>
      )}
      {joke && !isLoading && !error && (
        <Card paddingX={3} paddingY={4} tone="positive">
          <Text>{joke}</Text>
        </Card>
      )}
    </DashboardWidgetContainer>
  )
}
