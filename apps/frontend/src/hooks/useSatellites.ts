import { useQuery } from '@tanstack/react-query'
import { fetchSatellites } from '../lib/satelliteApi'

export function useSatellites() {
  return useQuery({
    queryKey: ['satellites'],
    queryFn: fetchSatellites,
    staleTime: 60_000,
  })
}
