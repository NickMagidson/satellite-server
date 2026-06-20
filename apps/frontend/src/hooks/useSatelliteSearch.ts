import { useMemo } from 'react'
import type { SatelliteMetadata } from '../lib/satelliteApi'
import { useSatellites } from './useSatellites'

export function useSatelliteSearch(query: string, limit = 8) {
  const satellitesQuery = useSatellites()

  const results = useMemo(() => {
    const search = query.trim().toLowerCase()
    const satellites = satellitesQuery.data?.satellites ?? []

    if (!search) {
      return satellites.slice(0, limit)
    }

    return satellites
      .filter((satellite) => matchesSatellite(satellite, search))
      .slice(0, limit)
  }, [limit, query, satellitesQuery.data?.satellites])

  return {
    ...satellitesQuery,
    results,
  }
}

function matchesSatellite(satellite: SatelliteMetadata, search: string) {
  return [
    satellite.id,
    satellite.name,
    satellite.noradCatId,
    satellite.objectId,
  ].some((value) => String(value ?? '').toLowerCase().includes(search))
}
