import type { SatelliteMetadata } from './satelliteApi'
import type { SatelliteFilters } from './satelliteFilters'

export type ChatSceneAction =
  | { type: 'selectSatellite'; id: string }
  | { type: 'patchFilters'; patch: Partial<SatelliteFilters> }
  | { type: 'resetFilters' }

export interface ChatRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  context: { selectedSatelliteId: string | null; filters: SatelliteFilters }
}

export interface ChatReply {
  text: string
  actions: ChatSceneAction[]
  searchResults: SatelliteMetadata[]
  positionNotices: Array<{
    id: string
    elementEpoch: string
    elementAgeDays: number
  }>
}

export async function sendChat(
  request: ChatRequest,
  signal: AbortSignal,
): Promise<ChatReply> {
  const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
  const response = await fetch(`${base}/api/agent/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...request, messages: request.messages.slice(-12) }),
    signal,
  })
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string
    } | null
    throw new Error(
      payload?.error ?? `Chat request failed (${response.status}).`,
    )
  }
  return response.json() as Promise<ChatReply>
}
