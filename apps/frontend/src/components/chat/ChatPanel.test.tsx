// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import type { SatelliteMetadata } from '../../lib/satelliteApi'
import { sendChat } from '../../lib/chatClient'
import type { ChatReply } from '../../lib/chatClient'
import { getDefaultFilters } from '../../lib/satelliteFilters'
import ChatPanel, { ChatReplyCards } from './ChatPanel'

vi.mock('../../lib/chatClient', () => ({ sendChat: vi.fn() }))

const satellites = [
  {
    id: '25544',
    name: 'ISS SAMPLE',
    noradCatId: 25544,
    orbitClass: 'LEO',
    objectType: 'PAYLOAD',
    countryCode: 'US',
  },
] as SatelliteMetadata[]

describe('ChatPanel', () => {
  beforeEach(() => vi.mocked(sendChat).mockReset())
  beforeAll(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    )
  })
  afterEach(cleanup)

  it('disables the composer until the catalog loads', () => {
    render(
      <ChatPanel
        satellites={satellites}
        catalogReady={false}
        selectedSatelliteId={null}
        filters={getDefaultFilters()}
        onSelectSatellite={vi.fn()}
        onFiltersChange={vi.fn()}
      />,
    )
    expect(screen.getByRole('textbox', { name: /ask lynx/i })).toHaveProperty(
      'disabled',
      true,
    )
  })

  it('shows the shared selection and offers a filter reset', () => {
    const onFiltersChange = vi.fn()
    render(
      <ChatPanel
        satellites={satellites}
        catalogReady
        selectedSatelliteId="25544"
        filters={{ orbitClasses: ['LEO'], objectTypes: [], countryCodes: [] }}
        onSelectSatellite={vi.fn()}
        onFiltersChange={onFiltersChange}
      />,
    )
    expect(screen.getByText(/Selected: ISS SAMPLE/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /clear chat filters/i }))
    expect(onFiltersChange).toHaveBeenCalledWith(getDefaultFilters())
  })

  it('lets a user select a search result and shows position age', () => {
    const onSelectSatellite = vi.fn()
    render(
      <ChatReplyCards
        reply={{
          text: 'Found one match',
          actions: [],
          searchResults: satellites,
          positionNotices: [
            {
              id: '25544',
              elementEpoch: '2025-03-26T06:00:00Z',
              elementAgeDays: 10,
            },
          ],
        }}
        satellites={satellites}
        onSelectSatellite={onSelectSatellite}
      />,
    )
    expect(screen.getByText(/2025-03-26/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /ISS SAMPLE/i }))
    expect(onSelectSatellite).toHaveBeenCalledWith('25544')
  })

  it('sends text history and applies model scene actions to the shared state', async () => {
    vi.mocked(sendChat).mockResolvedValue({
      text: 'Showing the ISS.',
      actions: [{ type: 'selectSatellite', id: '25544' }],
      searchResults: satellites,
      positionNotices: [],
    })
    const onSelectSatellite = vi.fn()
    render(
      <ChatPanel
        satellites={satellites}
        catalogReady
        selectedSatelliteId={null}
        filters={getDefaultFilters()}
        onSelectSatellite={onSelectSatellite}
        onFiltersChange={vi.fn()}
      />,
    )
    fireEvent.change(screen.getByRole('textbox', { name: /ask lynx/i }), {
      target: { value: 'Show the ISS' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send message/i }))
    await waitFor(() => expect(sendChat).toHaveBeenCalledOnce())
    expect(vi.mocked(sendChat).mock.calls[0]?.[0].messages.at(-1)).toEqual({
      role: 'user',
      content: 'Show the ISS',
    })
    await waitFor(() => expect(onSelectSatellite).toHaveBeenCalledWith('25544'))
    expect(screen.getByText('Showing the ISS.')).toBeTruthy()
  })

  it('applies a reply to filters changed while the model was running', async () => {
    const reply: ChatReply = {
      text: 'Showing US satellites.',
      actions: [{ type: 'patchFilters', patch: { countryCodes: ['US'] } }],
      searchResults: [],
      positionNotices: [],
    }
    vi.mocked(sendChat).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(reply), 100)),
    )
    const onFiltersChange = vi.fn()
    const props = {
      satellites,
      catalogReady: true,
      selectedSatelliteId: null,
      onSelectSatellite: vi.fn(),
      onFiltersChange,
    }
    const { rerender } = render(
      <ChatPanel {...props} filters={getDefaultFilters()} />,
    )
    fireEvent.change(screen.getByRole('textbox', { name: /ask lynx/i }), {
      target: { value: 'Filter to US' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send message/i }))
    await waitFor(() => expect(sendChat).toHaveBeenCalledOnce())
    rerender(
      <ChatPanel
        {...props}
        filters={{
          orbitClasses: [],
          objectTypes: ['PAYLOAD'],
          countryCodes: [],
        }}
      />,
    )
    await waitFor(() =>
      expect(onFiltersChange).toHaveBeenCalledWith({
        orbitClasses: [],
        objectTypes: ['PAYLOAD'],
        countryCodes: ['US'],
      }),
    )
  })

  it('keeps earlier result choices available after a follow-up', async () => {
    vi.mocked(sendChat)
      .mockResolvedValueOnce({
        text: 'Found ISS.',
        actions: [],
        searchResults: satellites,
        positionNotices: [],
      })
      .mockResolvedValueOnce({
        text: 'It is a payload.',
        actions: [],
        searchResults: [],
        positionNotices: [],
      })
    render(
      <ChatPanel
        satellites={satellites}
        catalogReady
        selectedSatelliteId={null}
        filters={getDefaultFilters()}
        onSelectSatellite={vi.fn()}
        onFiltersChange={vi.fn()}
      />,
    )
    const input = screen.getByRole('textbox', { name: /ask lynx/i })
    fireEvent.change(input, { target: { value: 'Find ISS' } })
    fireEvent.click(screen.getByRole('button', { name: /send message/i }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /ISS SAMPLE/i })).toBeTruthy(),
    )
    fireEvent.change(input, { target: { value: 'What kind is it?' } })
    fireEvent.click(screen.getByRole('button', { name: /send message/i }))
    await waitFor(() =>
      expect(screen.getByText('It is a payload.')).toBeTruthy(),
    )
    expect(screen.getByRole('button', { name: /ISS SAMPLE/i })).toBeTruthy()
  })

  it('shows model configuration failures in the pane', async () => {
    vi.mocked(sendChat).mockRejectedValueOnce(
      new Error('Chat requires OPENAI_API_KEY on the API server.'),
    )
    render(
      <ChatPanel
        satellites={satellites}
        catalogReady
        selectedSatelliteId={null}
        filters={getDefaultFilters()}
        onSelectSatellite={vi.fn()}
        onFiltersChange={vi.fn()}
      />,
    )
    fireEvent.change(screen.getByRole('textbox', { name: /ask lynx/i }), {
      target: { value: 'Show the ISS' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send message/i }))
    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      expect.stringContaining('OPENAI_API_KEY'),
    )
  })

  it('cancels an in-flight request without showing an error', async () => {
    let aborted = false
    vi.mocked(sendChat).mockImplementationOnce(
      (_request, signal) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener(
            'abort',
            () => {
              aborted = true
              reject(new DOMException('Aborted', 'AbortError'))
            },
            { once: true },
          )
        }),
    )
    render(
      <ChatPanel
        satellites={satellites}
        catalogReady
        selectedSatelliteId={null}
        filters={getDefaultFilters()}
        onSelectSatellite={vi.fn()}
        onFiltersChange={vi.fn()}
      />,
    )
    fireEvent.change(screen.getByRole('textbox', { name: /ask lynx/i }), {
      target: { value: 'Show the ISS' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send message/i }))
    fireEvent.click(
      await screen.findByRole('button', { name: /cancel response/i }),
    )
    await waitFor(() => expect(aborted).toBe(true))
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
