import { Transition } from '@headlessui/react'
import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import CesiumViewer from '../components/CesiumViewer'
import SatelliteDetailPanel from '../components/globe/SatelliteDetailPanel'
import SearchInput from '../components/search/SearchInput'
import { useSatellitePositions } from '../hooks/useSatellitePositions'
import { useSatelliteSearch } from '../hooks/useSatelliteSearch'
import { useSatellites } from '../hooks/useSatellites'
import type { SatelliteMetadata } from '../lib/satelliteApi'
import { isSatellitePositionOk } from '../lib/satelliteApi'

export const Route = createFileRoute('/')({ component: GlobePage })

function GlobePage() {
  const [query, setQuery] = useState('')
  const [selectedSatellite, setSelectedSatellite] = useState<SatelliteMetadata | null>(null)
  
  const { data, isPending, isError, error } = useSatellitePositions()
  const satellitesQuery = useSatellites()
  const { results: searchResults } = useSatelliteSearch(query)
  const okPositions = data?.positions.filter(isSatellitePositionOk) ?? []
  const satellites = satellitesQuery.data?.satellites ?? []
  
  const satellitesById = useMemo(
    () => new Map(satellites.map((satellite) => [satellite.id, satellite])),
    [satellites],
  )
  const dataError = error ?? satellitesQuery.error
  const selectedSatellitePosition = useMemo(
    () =>
      selectedSatellite
        ? okPositions.find((position) => position.id === selectedSatellite.id)
        : null,
    [okPositions, selectedSatellite],
  )

  function handleSelectedEntityIdChange(entityId: string | null) {
    if (!entityId) {
      setSelectedSatellite(null)
      setQuery('')
      return
    }

    const satellite = satellitesById.get(entityId) ?? null
    const position = okPositions.find((candidate) => candidate.id === entityId)
    setSelectedSatellite(satellite)
    setQuery(satellite?.name ?? position?.name ?? '')
  }

  return (
    <main className="globe-main relative w-full overflow-hidden bg-slate-950">
      <div className="absolute left-4 top-4 z-10">
        <SearchInput
          className="w-80"
          inputClassName="rounded-full border-white/20 shadow-lg focus-visible:ring-white/80"
          panelClassName="z-30"
          options={searchResults}
          value={selectedSatellite}
          onChange={(satellite) => {
            setSelectedSatellite(satellite)
            setQuery(satellite ? satellite.name : '')
          }}
          query={query}
          onQueryChange={(nextQuery) => {
            setQuery(nextQuery)

            if (selectedSatellite && nextQuery !== selectedSatellite.name) {
              setSelectedSatellite(null)
            }
          }}
          getOptionLabel={(satellite) => satellite.name}
          getOptionKey={(satellite) => satellite.id}
          getOptionDescription={(satellite) =>
            `NORAD ${satellite.noradCatId} · ${satellite.id}`
          }
          placeholder="Search satellites..."
        />
      </div>

      {(isError || satellitesQuery.isError) && (
        <p className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-md border border-red-200 bg-white px-3 py-2 text-sm text-red-600 shadow-sm">
          {dataError instanceof Error
            ? dataError.message
            : 'Failed to load satellite data.'}
        </p>
      )}
      <Transition
        show={Boolean(selectedSatellite)}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-x-4"
        enterTo="opacity-100 translate-x-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-x-0"
        leaveTo="opacity-0 translate-x-4"
      >
        <div className="absolute right-4 top-4 z-10 w-80 transform">
          {selectedSatellite ? (
            <SatelliteDetailPanel
              satellite={selectedSatellite}
              position={selectedSatellitePosition}
              onClose={() => {
                setSelectedSatellite(null)
                setQuery('')
              }}
            />
          ) : null}
        </div>
      </Transition>
      <CesiumViewer
        positions={okPositions}
        selectedEntityId={selectedSatellite?.id ?? null}
        onSelectedEntityIdChange={handleSelectedEntityIdChange}
        className="h-full w-full"
      />
      {(isPending || satellitesQuery.isPending) && (
        <p className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-md bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
          {isPending
            ? 'Loading satellite positions...'
            : 'Loading satellite catalog...'}
        </p>
      )}
    </main>
  )
}
