import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import GlobeFilters from '../components/globe/GlobeFilters'
import SatelliteDetailPanel from '../components/globe/SatelliteDetailPanel'
import SearchInput from '../components/search/SearchInput'
import type { GlobeFiltersState } from '../lib/globeFilters'
import {
  DEFAULT_GLOBE_FILTERS,
  ORBIT_CLASS_LABELS,
  buildFilterOptions,
} from '../lib/globeFilters'
import type {
  SatelliteMetadata,
  SatellitePositionOk,
} from '../lib/satelliteApi'

const sampleSatellitePositions: Record<string, SatellitePositionOk> = {
  iss: {
    id: 'iss',
    name: 'ISS (ZARYA)',
    status: 'ok',
    propagatedAt: '2026-06-25T12:00:00Z',
    geodetic: {
      latitudeDeg: 12.345,
      longitudeDeg: 98.765,
      altitudeKm: 420.1,
    },
    ecf: {
      xKm: 1234.5,
      yKm: -2356.7,
      zKm: 678.9,
    },
  },
}

const sampleSatellites: SatelliteMetadata[] = [
  {
    id: 'iss',
    name: 'ISS (ZARYA)',
    noradCatId: 25544,
    objectId: '1998-067A',
    epoch: '2026-06-25T00:00:00Z',
    classification: 'U',
    meanMotion: 15.5,
    inclinationDeg: 51.64,
    eccentricity: 0.0006511,
    orbitClass: 'LEO',
    objectType: 'Space Station',
    countryCode: 'US',
    launchDate: '1998-11-20',
    launchSite: 'Baikonur Cosmodrome',
    rcsSize: 'Medium',
    periodMin: 92.65,
    apoapsisKm: 418.7,
    periapsisKm: 416.3,
  },
  {
    id: 'hubble',
    name: 'Hubble Space Telescope',
    noradCatId: 20580,
    objectId: '1990-037B',
    epoch: '2026-06-25T00:00:00Z',
    classification: 'U',
    meanMotion: 15.1,
    inclinationDeg: 28.47,
    eccentricity: 0.0002858,
    orbitClass: 'LEO',
    objectType: 'Telescope',
    countryCode: 'US',
    launchDate: '1990-04-24',
    launchSite: 'Kennedy Space Center',
    rcsSize: 'Small',
    periodMin: 96.6,
    apoapsisKm: 568.0,
    periapsisKm: 534.0,
  },
  {
    id: 'gps-iif-10',
    name: 'GPS IIF-10',
    noradCatId: 38745,
    objectId: '2012-007A',
    epoch: '2026-06-25T00:00:00Z',
    classification: 'U',
    meanMotion: 2.0,
    inclinationDeg: 55.0,
    eccentricity: 0.000623,
    orbitClass: 'MEO',
    objectType: 'Navigation',
    countryCode: 'US',
    launchDate: '2012-02-21',
    launchSite: 'Cape Canaveral',
    rcsSize: 'Small',
    periodMin: 718.0,
    apoapsisKm: 20400.0,
    periapsisKm: 20400.0,
  },
  {
    id: 'galileo-12',
    name: 'Galileo-12',
    noradCatId: 34013,
    objectId: '2014-037A',
    epoch: '2026-06-25T00:00:00Z',
    classification: 'U',
    meanMotion: 2.0,
    inclinationDeg: 56.0,
    eccentricity: 0.00012,
    orbitClass: 'MEO',
    objectType: 'Navigation',
    countryCode: 'EU',
    launchDate: '2014-09-11',
    launchSite: 'Kourou',
    rcsSize: 'Small',
    periodMin: 718.0,
    apoapsisKm: 23222.0,
    periapsisKm: 23222.0,
  },
]

export const Route = createFileRoute('/ui-test')({ component: UiTestPage })

function UiTestPage() {
  const [filters, setFilters] = useState<GlobeFiltersState>(DEFAULT_GLOBE_FILTERS)
  const [query, setQuery] = useState('')
  const [selectedSatellite, setSelectedSatellite] =
    useState<SatelliteMetadata | null>(null)

  const searchResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return sampleSatellites.filter((satellite) => {
      if (!normalizedQuery) {
        return true
      }

      return (
        satellite.name.toLowerCase().includes(normalizedQuery) ||
        satellite.id.toLowerCase().includes(normalizedQuery) ||
        String(satellite.noradCatId).includes(normalizedQuery)
      )
    })
  }, [query])

  const filteredSatellites = useMemo(() => {
    return sampleSatellites.filter((satellite) => {
      const matchesOrbit =
        filters.orbitClasses.length === 0 ||
        filters.orbitClasses.includes(satellite.orbitClass)
      const matchesType =
        filters.objectTypes.length === 0 ||
        (satellite.objectType != null &&
          filters.objectTypes.includes(satellite.objectType))
      const matchesCountry =
        filters.countryCodes.length === 0 ||
        (satellite.countryCode != null &&
          filters.countryCodes.includes(satellite.countryCode))

      return matchesOrbit && matchesType && matchesCountry
    })
  }, [filters])

  const orbitOptions = useMemo(
    () =>
      buildFilterOptions(
        sampleSatellites.map((satellite) => satellite.orbitClass),
        (orbitClass) => ORBIT_CLASS_LABELS[orbitClass],
      ),
    [],
  )

  const objectTypeOptions = useMemo(
    () => buildFilterOptions(sampleSatellites.map((satellite) => satellite.objectType ?? 'Unknown')),
    [],
  )

  const countryOptions = useMemo(
    () => buildFilterOptions(sampleSatellites.map((satellite) => satellite.countryCode ?? 'Unknown')),
    [],
  )

  const selectedPosition = selectedSatellite
    ? sampleSatellitePositions[selectedSatellite.id]
    : null

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-10">
      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-950">
            UI Test Page
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            Interact with the reusable UI components without the globe page.
            Search, filters, and detail panel are rendered using local sample data.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-base font-semibold text-slate-950">
                Search input
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Type to filter example satellites and select an item.
              </p>
              <div className="mt-4 max-w-lg">
                <SearchInput
                  className="w-full"
                  inputClassName="rounded-full border-slate-300 bg-white px-4 py-2 shadow-sm"
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
                  placeholder="Search sample satellites..."
                />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-950">
                    Filter controls
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Try toggling filters to update the active sample set.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFilters(DEFAULT_GLOBE_FILTERS)}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Reset filters
                </button>
              </div>

              <div className="mt-4">
                <GlobeFilters
                  filters={filters}
                  orbitOptions={orbitOptions}
                  objectTypeOptions={objectTypeOptions}
                  countryOptions={countryOptions}
                  resultCount={filteredSatellites.length}
                  totalCount={sampleSatellites.length}
                  onChange={setFilters}
                />
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-base font-semibold text-slate-950">
                Selected satellite
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                The detail panel shows metadata and propagated position for the selected satellite.
              </p>
              <div className="mt-4">
                {selectedSatellite ? (
                  <SatelliteDetailPanel
                    satellite={selectedSatellite}
                    position={selectedPosition}
                    onClose={() => setSelectedSatellite(null)}
                  />
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-600">
                    Select a satellite from the search list to preview details.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-base font-semibold text-slate-950">
                Debug output
              </h2>
              <pre className="mt-4 max-h-64 overflow-auto rounded-3xl bg-slate-900 p-4 text-xs text-slate-100">
                {JSON.stringify(
                  {
                    query,
                    selectedSatelliteId: selectedSatellite?.id ?? null,
                    activeFilters: filters,
                    visibleCount: filteredSatellites.length,
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}
