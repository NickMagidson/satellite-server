import { Transition } from '@headlessui/react'
import { createFileRoute } from '@tanstack/react-router'
import { Home } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import CesiumViewer from '../components/CesiumViewer'
import type { CesiumViewerHandle } from '../components/CesiumViewer'
import SatelliteFilterPanel from '../components/filters/SatelliteFilterPanel'
import SatelliteDetailPanel from '../components/globe/SatelliteDetailPanel'
import SearchInput from '../components/search/SearchInput'
import { useFilterState } from '../hooks/useFilterState'
import { useSatelliteMotionWorker } from '../hooks/useSatelliteMotionWorker'
import { useSatelliteSearch } from '../hooks/useSatelliteSearch'
import { useSatellites } from '../hooks/useSatellites'
import type { SatelliteMetadata } from '../lib/satelliteApi'
import {
  applyFilters,
  extractUniqueCountryCodes,
  extractUniqueObjectTypes,
  extractUniqueOrbitClasses,
  reconcileFiltersWithCatalog,
} from '../lib/satelliteFilters'

export const Route = createFileRoute('/')({ component: GlobePage })

function GlobePage() {
  const [query, setQuery] = useState('')
  const [selectedSatellite, setSelectedSatellite] = useState<SatelliteMetadata | null>(null)
  const cesiumViewerRef = useRef<CesiumViewerHandle>(null)

  const satellitesQuery = useSatellites()
  const satellites = satellitesQuery.data?.satellites ?? []
  const { filters, setFilters, resetFilters, isHydrated } = useFilterState()
  const effectiveFilters = useMemo(
    () => reconcileFiltersWithCatalog(filters, satellites),
    [filters, satellites],
  )
  const filteredSatellites = useMemo(
    () => applyFilters(satellites, effectiveFilters),
    [effectiveFilters, satellites],
  )
  const visibleSatelliteIds = useMemo(
    () =>
      isHydrated && satellitesQuery.isSuccess
        ? new Set(filteredSatellites.map((satellite) => satellite.id))
        : null,
    [filteredSatellites, isHydrated, satellitesQuery.isSuccess],
  )
  const filterOptions = useMemo(
    () => ({
      orbitClasses: extractUniqueOrbitClasses(satellites),
      objectTypes: extractUniqueObjectTypes(satellites),
      countryCodes: extractUniqueCountryCodes(satellites),
    }),
    [satellites],
  )
  const motion = useSatelliteMotionWorker(visibleSatelliteIds)
  const { results: searchResults } = useSatelliteSearch(
    query,
    filteredSatellites,
  )

  const satellitesById = useMemo(
    () => new Map(satellites.map((satellite) => [satellite.id, satellite])),
    [satellites],
  )
  const dataError = motion.error ?? satellitesQuery.error

  const selectedPositionDetail =
    selectedSatellite && motion.selectedDetail?.id === selectedSatellite.id
      ? motion.selectedDetail
      : null

  useEffect(() => {
    if (
      selectedSatellite &&
      visibleSatelliteIds &&
      !visibleSatelliteIds.has(selectedSatellite.id)
    ) {
      setSelectedSatellite(null)
      setQuery('')
    }
  }, [selectedSatellite, visibleSatelliteIds])

  function handleSelectedEntityIdChange(entityId: string | null) {
    if (!entityId) {
      setSelectedSatellite(null)
      setQuery('')
      return
    }

    const satellite = satellitesById.get(entityId) ?? null
    const nameFromMotion =
      motion.nameByIndex[motion.indexById.get(entityId) ?? -1] ?? entityId
    setSelectedSatellite(satellite)
    setQuery(satellite?.name ?? nameFromMotion)
  }

  return (
    <main className="globe-main relative w-full overflow-hidden bg-slate-950">
      <div className="absolute left-4 top-4 z-10 flex w-96 items-start gap-2">
        <SearchInput
          className="min-w-0 flex-1"
          inputClassName="h-10 rounded-full border-white/10 focus-visible:ring-cyan-400/60"
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
        <SatelliteFilterPanel
          filters={effectiveFilters}
          options={filterOptions}
          onChange={setFilters}
          onReset={resetFilters}
        />
        <button
          type="button"
          onClick={() => cesiumViewerRef.current?.recenter()}
          className="flex size-10 shrink-0 items-center justify-center rounded-sm border border-white/10 bg-slate-950/85 text-slate-200 shadow-lg backdrop-blur transition hover:bg-slate-800 hover:text-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
          title="Re-center globe"
          aria-label="Re-center globe"
        >
          <Home className="size-4" aria-hidden="true" />
        </button>
      </div>

      {(motion.isError || satellitesQuery.isError) && (
        <p className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-md border border-red-500/40 bg-slate-950/90 px-3 py-2 text-sm text-red-300 shadow-sm backdrop-blur">
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
              position={selectedPositionDetail}
              onClose={() => {
                setSelectedSatellite(null)
                setQuery('')
              }}
            />
          ) : null}
        </div>
      </Transition>
      <CesiumViewer
        ref={cesiumViewerRef}
        motion={motion}
        selectedEntityId={selectedSatellite?.id ?? null}
        onSelectedEntityIdChange={handleSelectedEntityIdChange}
        className="h-full w-full"
      />
      {(motion.isPending || satellitesQuery.isPending) && (
        <p className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-md border border-slate-700/80 bg-slate-950/90 px-3 py-2 text-sm text-slate-300 shadow-sm backdrop-blur">
          {motion.isPending
            ? 'Loading satellite motion...'
            : 'Loading satellite catalog...'}
        </p>
      )}
      {!motion.isPending &&
        !satellitesQuery.isPending &&
        satellites.length > 0 &&
        filteredSatellites.length === 0 && (
          <p className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-md border border-slate-700/80 bg-slate-950/90 px-3 py-2 text-sm text-slate-300 shadow-sm backdrop-blur">
            No satellites match these filters.
          </p>
        )}
    </main>
  )
}
