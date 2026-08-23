import { useMemo } from 'react'
import type { SatelliteMetadata } from '../lib/satelliteApi'

export function useSatelliteSearch(
  query: string,
  satellites: SatelliteMetadata[],
  limit = 20,
) {
  const results = useMemo(() => {
    const search = query.trim().toLowerCase()

    if (!search) {
      return satellites.slice(0, limit)
    }

    return satellites
      .filter((satellite) => matchesSatellite(satellite, search))
      .slice(0, limit)
  }, [limit, query, satellites])

  return { results }
}

function matchesSatellite(satellite: SatelliteMetadata, search: string) {
  return [
    satellite.id,
    satellite.name,
    satellite.noradCatId,
    satellite.objectId,
  ].some((value) => String(value ?? '').toLowerCase().includes(search))
}
