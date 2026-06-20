import type {
  OrbitClass,
  SatelliteMetadata,
  SatellitePositionOk,
} from './satelliteApi'

export interface GlobeFiltersState {
  orbitClasses: OrbitClass[]
  objectTypes: string[]
  countryCodes: string[]
}

export interface FilterOption<TValue extends string> {
  value: TValue
  label: string
  count: number
}

export const DEFAULT_GLOBE_FILTERS: GlobeFiltersState = {
  orbitClasses: [],
  objectTypes: [],
  countryCodes: [],
}

export const ORBIT_CLASS_LABELS: Record<OrbitClass, string> = {
  LEO: 'Low Earth Orbit',
  MEO: 'Medium Earth Orbit',
  GEO: 'Geosynchronous',
  HEO: 'Highly Elliptical',
  OTHER: 'Other',
}

export function countActiveFilters(filters: GlobeFiltersState): number {
  return (
    filters.orbitClasses.length +
    filters.objectTypes.length +
    filters.countryCodes.length
  )
}

export function toggleFilterValue<TValue extends string>(
  values: TValue[],
  value: TValue,
): TValue[] {
  return values.includes(value)
    ? values.filter((candidate) => candidate !== value)
    : [...values, value]
}

export function buildFilterOptions<TValue extends string>(
  values: Array<TValue | null | undefined>,
  labelForValue: (value: TValue) => string = (value) => value,
): Array<FilterOption<TValue>> {
  const counts = new Map<TValue, number>()

  for (const value of values) {
    if (!value) {
      continue
    }

    counts.set(value, (counts.get(value) ?? 0) + 1)
  }

  return [...counts.entries()]
    .map(([value, count]) => ({
      value,
      label: labelForValue(value),
      count,
    }))
    .sort((first, second) => first.label.localeCompare(second.label))
}

export function matchesGlobeFilters(
  satellite: SatelliteMetadata | undefined,
  filters: GlobeFiltersState,
): boolean {
  if (!satellite) {
    return false
  }

  if (
    filters.orbitClasses.length > 0 &&
    !filters.orbitClasses.includes(satellite.orbitClass)
  ) {
    return false
  }

  if (
    filters.objectTypes.length > 0 &&
    (!satellite.objectType || !filters.objectTypes.includes(satellite.objectType))
  ) {
    return false
  }

  if (
    filters.countryCodes.length > 0 &&
    (!satellite.countryCode ||
      !filters.countryCodes.includes(satellite.countryCode))
  ) {
    return false
  }

  return true
}

export function filterSatellitePositions(
  positions: SatellitePositionOk[],
  satellitesById: Map<string, SatelliteMetadata>,
  filters: GlobeFiltersState,
): SatellitePositionOk[] {
  if (countActiveFilters(filters) === 0) {
    return positions
  }

  return positions.filter((position) =>
    matchesGlobeFilters(satellitesById.get(position.id), filters),
  )
}
