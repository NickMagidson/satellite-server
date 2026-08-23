import { useCallback, useEffect, useState } from 'react'
import {
  getDefaultFilters,
  loadFiltersFromStorage,
  saveFiltersToStorage,
} from '../lib/satelliteFilters'
import type { SatelliteFilters } from '../lib/satelliteFilters'

export function useFilterState() {
  const [filters, setFilters] = useState<SatelliteFilters>(getDefaultFilters)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setFilters(loadFiltersFromStorage())
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated) {
      saveFiltersToStorage(filters)
    }
  }, [filters, isHydrated])

  const resetFilters = useCallback(() => {
    setFilters(getDefaultFilters())
  }, [])

  return { filters, setFilters, resetFilters, isHydrated }
}
