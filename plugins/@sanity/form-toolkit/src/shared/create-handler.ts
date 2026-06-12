import {defineEventHandler, type H3Event} from 'h3' // For Nuxt.js/Nitro
import type {IncomingMessage, ServerResponse} from 'http'

// Utility function to detect the framework at runtime
const detectFramework = (): string => {
  if (process.env.NEXT_RUNTIME) {
    return 'nextjs'
  } else if (process.env.NUXT_ENV) {
    return 'nuxt'
  } else if (process.env.SVELTEKIT_ENV) {
    return 'sveltekit'
  } else if (process.env.REMIX_ENV) {
    return 'remix'
  } else if (process.env.ASTRO_ENV) {
    return 'astro'
  }
  throw new Error('Unable to detect framework.')
}

// Create a generic handler with predefined logic
const createHandler = (handlerFunc: () => Promise<unknown>) => {
  const framework = detectFramework()

  // Handler logic to fetch Mailchimp data
  const handlerLogic = async ({
    // eslint-disable-next-line
    req,
    res,
  }: {
    req: IncomingMessage | Request
    res?: ServerResponse
  }): Promise<unknown> => {
    try {
      const data = await handlerFunc()

      if (res) {
        // Send response directly for frameworks like Next.js and Nuxt.js
        res.writeHead(200, {'Content-Type': 'application/json'})
        res.end(JSON.stringify(data))
      }

      // Return the response for frameworks like SvelteKit, Remix, and Astro
      return data
    } catch (error) {
      if (error instanceof Error) {
        if (res) {
          res.writeHead(500, {'Content-Type': 'application/json'})
          res.end(JSON.stringify({error: error.message}))
        }
        return {error: error.message}
      }
      // Handle non-Error types (e.g., strings, objects)
      if (res) {
        res.writeHead(500, {'Content-Type': 'application/json'})
        res.end(JSON.stringify({error: 'An unexpected error occurred'}))
      }
      return {error: 'An unexpected error occurred'}
    }
  }

  // Framework-specific implementations
  if (framework === 'nextjs') {
    return async (req: IncomingMessage, res: ServerResponse) => {
      // Set CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*') // Allow all origins
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS') // Allowed HTTP methods
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization') // Allowed headers

      await handlerLogic({req, res})
    }
  } else if (framework === 'nuxt') {
    return defineEventHandler(async (event: H3Event) => {
      const req = event.node.req
      const res = event.node.res
      return handlerLogic({req, res})
    })
  } else if (framework === 'sveltekit') {
    return {
      GET: async ({request}: {request: Request}) => {
        const result = await handlerLogic({req: request})
        return new Response(JSON.stringify(result), {
          headers: {'Content-Type': 'application/json'},
        })
      },
    }
  } else if (framework === 'remix') {
    return {
      loader: async ({request}: {request: Request}) => {
        const result = await handlerLogic({req: request})
        return new Response(JSON.stringify(result), {
          headers: {'Content-Type': 'application/json'},
        })
      },
    }
  } else if (framework === 'astro') {
    return {
      get: async ({request}: {request: Request}) => {
        const result = await handlerLogic({req: request})
        return {
          body: JSON.stringify(result),
          headers: {'Content-Type': 'application/json'},
        }
      },
    }
  }
  throw new Error(`Unsupported framework: ${framework}`)
}

export default createHandler
