import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchSatellites } from '../lib/satelliteApi'
import type { SatelliteMetadata } from '../lib/satelliteApi'

export function useSatelliteSearch(query: string, limit = 8) {
  const satellitesQuery = useQuery({
    queryKey: ['satellites'],
    queryFn: fetchSatellites,
    staleTime: 60_000,
  })

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
