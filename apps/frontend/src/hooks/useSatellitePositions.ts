import { useQuery } from '@tanstack/react-query'
import { fetchSatellitePositions } from '../lib/satelliteApi'

export function useSatellitePositions() {
  return useQuery({
    queryKey: ['satellite-positions'],
    queryFn: fetchSatellitePositions,
    refetchInterval: (query) => query.state.data?.updateIntervalMs ?? 1000,
  })
}
