import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import SearchInput from '../components/search/SearchInput'
import { useSatelliteSearch } from '../hooks/useSatelliteSearch'
import type { SatelliteMetadata } from '../lib/satelliteApi'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const [query, setQuery] = useState('')
  const [selectedSatellite, setSelectedSatellite] =
    useState<SatelliteMetadata | null>(null)
  const { results, isPending, isError, error } = useSatelliteSearch(query)

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <section className="space-y-4 rounded-lg border border-slate-200 p-6">
        <div>
          <h1 className="text-lg font-semibold text-slate-950">
            Satellite search
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Reusable Headless UI autocomplete powered by the satellite catalog.
          </p>
        </div>

        <SearchInput
          options={results}
          value={selectedSatellite}
          onChange={(satellite) => {
            setSelectedSatellite(satellite)
            setQuery(satellite ? satellite.name : '')
          }}
          query={query}
          onQueryChange={setQuery}
          getOptionLabel={(satellite) => satellite.name}
          getOptionKey={(satellite) => satellite.id}
          getOptionDescription={(satellite) =>
            `NORAD ${satellite.noradCatId} - ${satellite.id}`
          }
          placeholder="Search satellites..."
        />

        {isPending && <p className="text-sm text-slate-500">Loading...</p>}

        {isError && (
          <p className="text-sm text-red-600">
            {error instanceof Error
              ? error.message
              : 'Failed to load satellites.'}
          </p>
        )}

        {selectedSatellite ? (
          <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
            Selected:{' '}
            <span className="font-medium text-slate-950">
              {selectedSatellite.name}
            </span>
          </div>
        ) : null}
      </section>
    </main>
  )
}
