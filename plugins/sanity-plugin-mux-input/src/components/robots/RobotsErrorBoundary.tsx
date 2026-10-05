import {Card, Stack, Text} from '@sanity/ui'
import {Component, type ErrorInfo, type PropsWithChildren} from 'react'

interface State {
  error?: Error
}

/** Keeps a fault in the Robots panel from taking the rest of the video field down with it. */
export class RobotsErrorBoundary extends Component<PropsWithChildren, State> {
  override state: State = {}

  static getDerivedStateFromError(error: Error): State {
    return {error}
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[sanity-plugin-mux-input] The Robots panel failed to render', error, info)
  }

  override render() {
    if (this.state.error) {
      return (
        <Card padding={3} radius={2} tone="critical" border>
          <Stack gap={3}>
            <Text size={1} weight="semibold">
              The Robots panel could not load
            </Text>
            <Text size={1}>
              Everything else on this video still works. Reloading usually clears this; if it
              doesn’t, the details are in the browser console.
            </Text>
          </Stack>
        </Card>
      )
    }
    return this.props.children
  }
}
