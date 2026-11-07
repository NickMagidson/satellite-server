import {
  AssistantRuntimeProvider,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useLocalRuntime,
} from '@assistant-ui/react'
import type { ChatModelAdapter } from '@assistant-ui/react'
import { ArrowUp, Square } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import type { SatelliteMetadata } from '../../lib/satelliteApi'
import type { ChatReply } from '../../lib/chatClient'
import { sendChat } from '../../lib/chatClient'
import type { SatelliteFilters } from '../../lib/satelliteFilters'
import { getDefaultFilters } from '../../lib/satelliteFilters'
import { applyChatActions } from '../../lib/chatActions'

interface ChatPanelProps {
  satellites: SatelliteMetadata[]
  catalogReady: boolean
  selectedSatelliteId: string | null
  filters: SatelliteFilters
  onSelectSatellite: (id: string) => void
  onFiltersChange: (filters: SatelliteFilters) => void
}

export function ChatReplyCards({
  reply,
  satellites,
  onSelectSatellite,
}: {
  reply: ChatReply
  satellites: SatelliteMetadata[]
  onSelectSatellite: (id: string) => void
}) {
  const loaded = new Set(satellites.map((satellite) => satellite.id))
  const results = reply.searchResults
    .filter((satellite) => loaded.has(satellite.id))
    .slice(0, 20)
  return (
    <div className="space-y-2" aria-label="Latest chat results">
      {results.length > 0 && (
        <div className="space-y-1">
          <p className="text-data text-ink-faint">Catalog matches</p>
          {results.map((satellite) => (
            <button
              key={satellite.id}
              type="button"
              onClick={() => onSelectSatellite(satellite.id)}
              className="w-full rounded-sm border border-line bg-void-700 px-3 py-2 text-left text-sm text-object hover:border-solar focus:outline-none focus-visible:ring-2 focus-visible:ring-solar/60"
            >
              <span className="block truncate">{satellite.name}</span>
              <span className="font-mono text-xs text-ink-muted">
                NORAD {satellite.noradCatId}
              </span>
            </button>
          ))}
        </div>
      )}
      {reply.positionNotices.map((notice) => (
        <p
          key={notice.id}
          className="rounded-sm border border-solar/30 bg-solar/5 p-2 text-xs text-ink-muted"
        >
          Elements from {notice.elementEpoch};{' '}
          {notice.elementAgeDays.toFixed(1)} days old. Propagated positions may
          be inaccurate.
        </p>
      ))}
    </div>
  )
}

function UserMessage() {
  return (
    <MessagePrimitive.Root className="ml-8 rounded-sm border border-line-strong bg-void-600 px-3 py-2 text-sm leading-relaxed text-object">
      <MessagePrimitive.Parts />
    </MessagePrimitive.Root>
  )
}

function AssistantMessage() {
  return (
    <MessagePrimitive.Root className="mr-5 border-l-2 border-solar/60 py-1 pl-3 text-sm leading-relaxed whitespace-pre-wrap text-object">
      <MessagePrimitive.Parts />
      <MessagePrimitive.Error />
    </MessagePrimitive.Root>
  )
}

const messageComponents = { UserMessage, AssistantMessage }

export default function ChatPanel(props: ChatPanelProps) {
  const [replies, setReplies] = useState<ChatReply[]>([])
  const [error, setError] = useState<string | null>(null)
  const latest = useRef(props)
  latest.current = props

  const adapter = useMemo<ChatModelAdapter>(
    () => ({
      async run({ messages, abortSignal }) {
        setError(null)
        const current = latest.current
        if (!current.catalogReady)
          throw new Error('The satellite catalog is still loading.')
        const history = messages
          .filter(
            (message) =>
              message.role === 'user' || message.role === 'assistant',
          )
          .map((message) => ({
            role: message.role,
            content: message.content
              .filter((part) => part.type === 'text')
              .map((part) => part.text)
              .join('\n')
              .trim(),
          }))
          .filter((message) => message.content.length > 0)
          .slice(-12)
        try {
          const next = await sendChat(
            {
              messages: history,
              context: {
                selectedSatelliteId: current.selectedSatelliteId,
                filters: current.filters,
              },
            },
            abortSignal,
          )
          if (abortSignal.aborted) return { content: [] }
          const live = latest.current
          const state = applyChatActions(
            next.actions,
            {
              selectedSatelliteId: live.selectedSatelliteId,
              filters: live.filters,
            },
            live.satellites,
          )
          if (state.filters !== live.filters)
            live.onFiltersChange(state.filters)
          if (
            state.selectedSatelliteId &&
            state.selectedSatelliteId !== live.selectedSatelliteId
          )
            live.onSelectSatellite(state.selectedSatelliteId)
          setReplies((previous) => [...previous, next].slice(-10))
          return { content: [{ type: 'text', text: next.text }] }
        } catch (cause) {
          if (abortSignal.aborted) return { content: [] }
          const message =
            cause instanceof Error ? cause.message : 'Chat request failed.'
          setError(message)
          return { content: [{ type: 'text', text: message }] }
        }
      },
    }),
    [],
  )
  const runtime = useLocalRuntime(adapter)
  const selected = props.satellites.find(
    (satellite) => satellite.id === props.selectedSatelliteId,
  )
  const activeFilters = [
    ...props.filters.orbitClasses,
    ...props.filters.objectTypes,
    ...props.filters.countryCodes,
  ]

  function selectResult(id: string) {
    const current = latest.current
    const next = applyChatActions(
      [{ type: 'selectSatellite', id }],
      {
        selectedSatelliteId: current.selectedSatelliteId,
        filters: current.filters,
      },
      current.satellites,
    )
    if (next.filters !== current.filters) current.onFiltersChange(next.filters)
    if (next.selectedSatelliteId)
      current.onSelectSatellite(next.selectedSatelliteId)
  }

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ThreadPrimitive.Root className="flex h-full min-h-0 flex-col">
        {(selected || activeFilters.length > 0) && (
          <div className="shrink-0 border-b border-line px-4 py-2 text-xs text-ink-muted">
            {selected && <p className="truncate">Selected: {selected.name}</p>}
            {activeFilters.length > 0 && (
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="min-w-0 truncate">
                  Filters: {activeFilters.join(', ')}
                </p>
                <button
                  type="button"
                  aria-label="Clear chat filters"
                  onClick={() => props.onFiltersChange(getDefaultFilters())}
                  className="shrink-0 text-solar hover:text-object focus:outline-none focus-visible:underline"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        )}
        <ThreadPrimitive.Viewport className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5">
          <ThreadPrimitive.Empty>
            <div className="space-y-4">
              <div>
                <p className="text-data mb-2 text-solar">Satellite explorer</p>
                <h2 className="text-lg font-semibold text-object">
                  What would you like to see?
                </h2>
                <p className="mt-2 text-sm text-ink-muted">
                  Ask about satellites in the catalog or change what the globe
                  shows.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  'Show the ISS',
                  'Show LEO satellites',
                  'Which satellite is selected?',
                ].map((prompt) => (
                  <ThreadPrimitive.Suggestion
                    key={prompt}
                    prompt={prompt}
                    send
                    disabled={!props.catalogReady}
                    className="rounded-sm border border-line-strong px-3 py-2 text-left text-xs text-ink-muted hover:border-solar hover:text-object disabled:opacity-40"
                  >
                    {prompt}
                  </ThreadPrimitive.Suggestion>
                ))}
              </div>
            </div>
          </ThreadPrimitive.Empty>
          <ThreadPrimitive.Messages components={messageComponents} />
          <ThreadPrimitive.If running>
            <p className="text-xs text-ink-muted" role="status">
              Lynx is searching the catalog…
            </p>
          </ThreadPrimitive.If>
          {replies.map((reply, index) =>
            reply.searchResults.length || reply.positionNotices.length ? (
              <ChatReplyCards
                key={index}
                reply={reply}
                satellites={props.satellites}
                onSelectSatellite={selectResult}
              />
            ) : null,
          )}
        </ThreadPrimitive.Viewport>
        <div className="shrink-0 border-t border-line px-4 py-3">
          {error && (
            <p role="alert" className="mb-2 text-xs text-flare">
              {error}
            </p>
          )}
          {!props.catalogReady && (
            <p className="mb-2 text-xs text-ink-muted">
              Waiting for the satellite catalog…
            </p>
          )}
          <ComposerPrimitive.Root className="flex items-end gap-2 rounded-sm border border-line-strong bg-void-700 p-2 focus-within:border-solar/60">
            <ComposerPrimitive.Input
              aria-label="Ask Lynx"
              placeholder="Ask Lynx about satellites…"
              disabled={!props.catalogReady}
              className="min-h-10 min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-object placeholder:text-ink-faint focus:outline-none disabled:opacity-50"
            />
            <ThreadPrimitive.If running>
              <button
                type="button"
                onClick={() => runtime.thread.cancelRun()}
                aria-label="Cancel response"
                className="flex size-10 shrink-0 items-center justify-center rounded-sm text-ink-muted hover:bg-void-600 hover:text-object"
              >
                <Square className="size-4" aria-hidden="true" />
              </button>
            </ThreadPrimitive.If>
            <ThreadPrimitive.If running={false}>
              <ComposerPrimitive.Send
                disabled={!props.catalogReady}
                aria-label="Send message"
                className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-solar text-void hover:bg-solar/80 disabled:opacity-50"
              >
                <ArrowUp className="size-4" aria-hidden="true" />
              </ComposerPrimitive.Send>
            </ThreadPrimitive.If>
          </ComposerPrimitive.Root>
        </div>
      </ThreadPrimitive.Root>
    </AssistantRuntimeProvider>
  )
}
