import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import CesiumViewer from '../components/CesiumViewer'
import GlobeFilters from '../components/globe/GlobeFilters'
import SearchInput from '../components/search/SearchInput'
import { useSatellitePositions } from '../hooks/useSatellitePositions'
import { useSatelliteSearch } from '../hooks/useSatelliteSearch'
import { useSatellites } from '../hooks/useSatellites'
import { isSatellitePositionOk } from '../lib/satelliteApi'
import type { SatelliteMetadata } from '../lib/satelliteApi'
import {
  DEFAULT_GLOBE_FILTERS,
  ORBIT_CLASS_LABELS,
  buildFilterOptions,
  filterSatellitePositions,
} from '../lib/globeFilters'
import type { GlobeFiltersState } from '../lib/globeFilters'

export const Route = createFileRoute('/globe')({ component: GlobePage })

function GlobePage() {
  const [filters, setFilters] = useState<GlobeFiltersState>(
    DEFAULT_GLOBE_FILTERS,
  )
  const [query, setQuery] = useState('')
  const [selectedSatellite, setSelectedSatellite] =
    useState<SatelliteMetadata | null>(null)
  const { data, isPending, isError, error } = useSatellitePositions()
  const satellitesQuery = useSatellites()
  const { results: searchResults } = useSatelliteSearch(query)
  const okPositions = data?.positions.filter(isSatellitePositionOk) ?? []
  const satellites = satellitesQuery.data?.satellites ?? []
  const satellitesById = useMemo(
    () => new Map(satellites.map((satellite) => [satellite.id, satellite])),
    [satellites],
  )
  const filteredPositions = useMemo(
    () => filterSatellitePositions(okPositions, satellitesById, filters),
    [filters, okPositions, satellitesById],
  )
  const visiblePositions = useMemo(() => {
    if (!selectedSatellite) {
      return filteredPositions
    }

    return filteredPositions.filter(
      (position) => position.id === selectedSatellite.id,
    )
  }, [filteredPositions, selectedSatellite])
  const orbitOptions = useMemo(
    () =>
      buildFilterOptions(
        satellites.map((satellite) => satellite.orbitClass),
        (orbitClass) => ORBIT_CLASS_LABELS[orbitClass],
      ),
    [satellites],
  )
  const objectTypeOptions = useMemo(
    () => buildFilterOptions(satellites.map((satellite) => satellite.objectType)),
    [satellites],
  )
  const countryOptions = useMemo(
    () => buildFilterOptions(satellites.map((satellite) => satellite.countryCode)),
    [satellites],
  )
  const dataError = error ?? satellitesQuery.error

  return (
    <main className="globe-main relative w-full overflow-hidden bg-slate-950">
      <div className="absolute left-4 top-4 z-10 flex items-start gap-2">
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

        <GlobeFilters
          filters={filters}
          orbitOptions={orbitOptions}
          objectTypeOptions={objectTypeOptions}
          countryOptions={countryOptions}
          resultCount={visiblePositions.length}
          totalCount={okPositions.length}
          onChange={setFilters}
        />
      </div>

      {(isError || satellitesQuery.isError) && (
        <p className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-md border border-red-200 bg-white px-3 py-2 text-sm text-red-600 shadow-sm">
          {dataError instanceof Error
            ? dataError.message
            : 'Failed to load satellite data.'}
        </p>
      )}
      <CesiumViewer positions={visiblePositions} className="h-full w-full" />
      {(isPending || satellitesQuery.isPending) && (
        <p className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-md bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
          {isPending
            ? 'Loading satellite positions...'
            : 'Loading satellite catalog...'}
        </p>
      )}
      {!isPending && !satellitesQuery.isPending && visiblePositions.length === 0 ? (
        <p className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-md bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
          No satellites match the selected search and filters.
        </p>
      ) : null}
    </main>
  )
}
