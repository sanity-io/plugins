// @vitest-environment jsdom
import type {MutationEvent} from '@sanity/client'
import {act, render} from '@testing-library/react'
import {Activity} from 'react'
import type {SanityDocument} from 'sanity'
import {afterEach, describe, expect, test, vi} from 'vitest'

import GraphView, {applyMutation, GraphData, type GraphState} from './GraphView'

const {FakeForceGraph, instances, client, listener} = vi.hoisted(() => {
  class FakeForceGraph {
    destroyed = false
    paused = false
    data: unknown[] = []

    constructor() {
      instances.push(this)
    }

    graphData(data: unknown) {
      this.data.push(data)
      return this
    }

    pauseAnimation() {
      this.paused = true
      return this
    }

    resumeAnimation() {
      this.paused = false
      return this
    }

    _destructor() {
      this.destroyed = true
    }
  }

  // Every other setter is chainable and irrelevant to the lifecycle
  for (const method of [
    'nodeAutoColorBy',
    'enableNodeDrag',
    'linkColor',
    'nodeLabel',
    'nodeRelSize',
    'linkCanvasObject',
    'onNodeHover',
    'onNodeClick',
    'nodeVal',
    'nodeCanvasObject',
    'onRenderFramePost',
  ]) {
    Object.defineProperty(FakeForceGraph.prototype, method, {
      value() {
        return this
      },
    })
  }

  const instances: FakeForceGraph[] = []
  const listener = {subscriptions: 0, unsubscriptions: 0}
  const client = {
    fetch: vi.fn(() => Promise.resolve([{_id: 'a', _type: 'author', title: 'A'}])),
    listen: () => ({
      subscribe: () => {
        listener.subscriptions++
        return {
          unsubscribe: () => {
            listener.unsubscriptions++
          },
        }
      },
    }),
  }

  return {FakeForceGraph, instances, client, listener}
})

vi.mock('force-graph', () => ({default: FakeForceGraph}))
vi.mock('sanity', () => ({
  useClient: () => client,
  useUserColorManager: () => ({get: () => ({tints: {400: {hex: '#000'}}})}),
}))
vi.mock('sanity/router', () => ({useRouter: () => ({navigateIntent: vi.fn()})}))
vi.mock('@sanity/ui', () => ({
  useTheme: () => ({
    sanity: {fonts: {text: {family: 'sans-serif'}}, space: [0, 4, 8], radius: [0, 2, 4]},
  }),
}))

const tool = {options: {}}

describe('GraphView', () => {
  afterEach(() => {
    instances.length = 0
    listener.subscriptions = 0
    listener.unsubscriptions = 0
    client.fetch.mockClear()
  })

  test('keeps its documents, listener and force-graph instance while an Activity boundary hides it', async () => {
    const tree = (mode: 'visible' | 'hidden') => (
      <Activity mode={mode}>
        <GraphView tool={tool} />
      </Activity>
    )
    const {rerender, unmount} = render(tree('visible'))
    await act(async () => {
      await Promise.resolve()
    })

    expect(instances).toHaveLength(1)
    const graph = instances[0]
    expect(client.fetch).toHaveBeenCalledTimes(1)
    expect(listener.subscriptions).toBe(1)
    // The empty initial data and the loaded documents
    expect(graph.data).toHaveLength(2)

    rerender(tree('hidden'))
    expect(graph.paused).toBe(true)
    expect(graph.destroyed).toBe(false)
    expect(listener.unsubscriptions).toBe(0)

    rerender(tree('visible'))
    await act(async () => {
      await Promise.resolve()
    })
    expect(instances).toHaveLength(1)
    expect(graph.paused).toBe(false)
    expect(client.fetch).toHaveBeenCalledTimes(1)
    expect(listener.subscriptions).toBe(1)
    // The simulation is not handed the same data again, which would reheat it
    expect(graph.data).toHaveLength(2)

    unmount()
    expect(graph.destroyed).toBe(true)
    expect(listener.unsubscriptions).toBe(1)
  })

  test('releases everything when the hidden tool is unmounted', async () => {
    const tree = (mode: 'visible' | 'hidden') => (
      <Activity mode={mode}>
        <GraphView tool={tool} />
      </Activity>
    )
    const {rerender, unmount} = render(tree('visible'))
    await act(async () => {
      await Promise.resolve()
    })
    const graph = instances[0]

    rerender(tree('hidden'))
    // React does not clean up a hidden tree's effects again on unmount; the DOM is watched
    // instead, and MutationObserver callbacks are delivered as microtasks
    unmount()
    await act(async () => {
      await Promise.resolve()
    })

    expect(graph.destroyed).toBe(true)
    expect(listener.unsubscriptions).toBe(1)
  })

  test('loads a new query while visible and keeps the graph instance', async () => {
    const tree = (query: string) => <GraphView tool={{options: {query}}} />
    const {rerender, unmount} = render(tree('*[_type == "a"]'))
    await act(async () => {
      await Promise.resolve()
    })
    const graph = instances[0]

    rerender(tree('*[_type == "b"]'))
    await act(async () => {
      await Promise.resolve()
    })
    expect(listener.unsubscriptions).toBe(1)
    expect(listener.subscriptions).toBe(2)
    expect(client.fetch).toHaveBeenCalledTimes(2)
    expect(client.fetch).toHaveBeenLastCalledWith('*[_type == "b"]')
    expect(instances).toHaveLength(1)
    expect(graph.destroyed).toBe(false)

    // The old query's cleanup ran with the tool still in the document, which is what a hide
    // looks like too; a watch it left armed would dispose the old query a second time here
    unmount()
    await act(async () => {
      await Promise.resolve()
    })
    expect(listener.unsubscriptions).toBe(2)
    expect(graph.destroyed).toBe(true)
  })
})

describe('applyMutation', () => {
  const stamps = {_rev: 'r', _createdAt: '', _updatedAt: ''}
  const author = {...stamps, _id: 'a', _type: 'author', title: 'A'} as SanityDocument
  const post = {
    ...stamps,
    _id: 'b',
    _type: 'post',
    title: 'B',
    author: {_ref: 'a'},
  } as SanityDocument

  function loaded(docs: SanityDocument[]): GraphState {
    const graph = new GraphData(docs)
    // force-graph swaps the link endpoints for the node objects once it is handed the data
    const nodesById = new Map<string, unknown>(graph.data.nodes.map((n: any) => [n.id, n]))
    for (const link of graph.data.links) {
      link.source = nodesById.get(link.source)
      link.target = nodesById.get(link.target)
    }
    return {documents: docs, graph}
  }

  function mutation(
    transition: MutationEvent['transition'],
    documentId: string,
    result?: MutationEvent['result'],
  ): MutationEvent {
    return {
      type: 'mutation',
      documentId,
      eventId: 'event',
      identity: 'user',
      mutations: [],
      timestamp: '',
      transactionId: 'transaction',
      transition,
      visibility: 'query',
      transactionTotalEvents: 1,
      transactionCurrentEvent: 0,
      result,
    }
  }

  test('adds a node and its links for a document that appears', () => {
    const state = loaded([author, post])
    const doc = {...stamps, _id: 'c', _type: 'post', author: {_ref: 'a'}}
    const {next, docNode} = applyMutation(state, mutation('appear', 'c', doc))

    expect(next.documents.map((d) => d._id)).toEqual(['a', 'b', 'c'])
    expect(next.graph).not.toBe(state.graph)
    expect(next.graph.data.nodes).toHaveLength(3)
    expect(docNode).toBe(next.graph.data.nodes[2])
    expect(docNode.doc).toBe(doc)
    expect(next.graph.data.links).toContainEqual({source: 'c', target: 'a'})
    // Existing nodes are the same objects, so the simulation keeps their positions
    expect(next.graph.data.nodes[0]).toBe(state.graph.data.nodes[0])
    expect(next.graph.data.nodes[1]).toBe(state.graph.data.nodes[1])
  })

  test('replaces the links of a document whose references changed', () => {
    const state = loaded([author, post])
    const doc = {...stamps, _id: 'drafts.b', _type: 'post', title: 'B'}
    const {next, docNode} = applyMutation(state, mutation('update', 'drafts.b', doc))

    expect(docNode).toBe(state.graph.data.nodes[1])
    expect(docNode.doc).toBe(doc)
    expect(doc._id).toBe('b')
    expect(next.documents[1]).toBe(doc)
    expect(next.graph).not.toBe(state.graph)
    expect(next.graph.data.links).toEqual([])
    expect(next.graph.data.nodes).toEqual(state.graph.data.nodes)
  })

  test('keeps the graph for an update that leaves the references alone', () => {
    const state = loaded([author, post])
    const doc = {...post, title: 'B2'}
    const {next, docNode} = applyMutation(state, mutation('update', 'b', doc))

    expect(next.graph).toBe(state.graph)
    expect(next.documents).not.toBe(state.documents)
    expect(next.documents[1]).toBe(doc)
    expect(docNode).toBe(state.graph.data.nodes[1])
    expect(docNode.doc).toBe(doc)
  })

  test('removes the node and links of a document that disappears', () => {
    const state = loaded([author, post])
    const {next, docNode} = applyMutation(state, mutation('disappear', 'b'))

    expect(docNode).toBeUndefined()
    expect(next.documents).toEqual([author])
    expect(next.graph.data.nodes).toEqual([state.graph.data.nodes[0]])
    expect(next.graph.data.links).toEqual([])
  })

  test('returns the same state for a mutation without a document', () => {
    const state = loaded([author, post])
    const {next, docNode} = applyMutation(state, mutation('update', 'b'))

    expect(next).toBe(state)
    expect(docNode).toBeUndefined()
  })
})
