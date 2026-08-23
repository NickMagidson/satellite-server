import type { OrbitClass, SatelliteMetadata } from './satelliteApi'

export interface SatelliteFilters {
  orbitClasses: OrbitClass[]
  objectTypes: string[]
  countryCodes: string[]
}

export const SATELLITE_FILTERS_STORAGE_KEY = 'satellite-filters:v1'

const ORBIT_CLASS_ORDER: OrbitClass[] = ['LEO', 'MEO', 'GEO', 'HEO', 'OTHER']
const ORBIT_CLASSES = new Set<OrbitClass>(ORBIT_CLASS_ORDER)

export function getDefaultFilters(): SatelliteFilters {
  return {
    orbitClasses: [],
    objectTypes: [],
    countryCodes: [],
  }
}

function uniqueStrings(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return [
    ...new Set(
      value.filter(
        (item): item is string => typeof item === 'string' && item.trim() !== '',
      ),
    ),
  ]
}

function parseFilters(value: unknown): SatelliteFilters {
  if (!value || typeof value !== 'object') {
    return getDefaultFilters()
  }

  const candidate = value as Record<string, unknown>
  const orbitClasses = Array.isArray(candidate.orbitClasses)
    ? candidate.orbitClasses.filter(
        (item): item is OrbitClass =>
          typeof item === 'string' && ORBIT_CLASSES.has(item as OrbitClass),
      )
    : []

  return {
    orbitClasses: [...new Set(orbitClasses)],
    objectTypes: uniqueStrings(candidate.objectTypes),
    countryCodes: uniqueStrings(candidate.countryCodes),
  }
}

export function loadFiltersFromStorage(): SatelliteFilters {
  if (typeof window === 'undefined') {
    return getDefaultFilters()
  }

  try {
    const stored = window.localStorage.getItem(SATELLITE_FILTERS_STORAGE_KEY)
    return stored ? parseFilters(JSON.parse(stored)) : getDefaultFilters()
  } catch {
    return getDefaultFilters()
  }
}

export function saveFiltersToStorage(filters: SatelliteFilters): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(
      SATELLITE_FILTERS_STORAGE_KEY,
      JSON.stringify(parseFilters(filters)),
    )
  } catch {
    // Storage may be unavailable in private or restricted browser contexts.
  }
}

export function extractUniqueOrbitClasses(
  satellites: SatelliteMetadata[],
): OrbitClass[] {
  const available = new Set(satellites.map((satellite) => satellite.orbitClass))
  return ORBIT_CLASS_ORDER.filter((orbitClass) => available.has(orbitClass))
}

function extractUniqueStrings(values: Array<string | null>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))].sort(
    (first, second) => first.localeCompare(second),
  )
}

export function extractUniqueObjectTypes(
  satellites: SatelliteMetadata[],
): string[] {
  return extractUniqueStrings(
    satellites.map((satellite) => satellite.objectType),
  )
}

export function extractUniqueCountryCodes(
  satellites: SatelliteMetadata[],
): string[] {
  return extractUniqueStrings(
    satellites.map((satellite) => satellite.countryCode),
  )
}

export function reconcileFiltersWithCatalog(
  filters: SatelliteFilters,
  satellites: SatelliteMetadata[],
): SatelliteFilters {
  const orbitClasses = new Set(extractUniqueOrbitClasses(satellites))
  const objectTypes = new Set(extractUniqueObjectTypes(satellites))
  const countryCodes = new Set(extractUniqueCountryCodes(satellites))

  return {
    orbitClasses: filters.orbitClasses.filter((value) => orbitClasses.has(value)),
    objectTypes: filters.objectTypes.filter((value) => objectTypes.has(value)),
    countryCodes: filters.countryCodes.filter((value) => countryCodes.has(value)),
  }
}

export function applyFilters(
  satellites: SatelliteMetadata[],
  filters: SatelliteFilters,
): SatelliteMetadata[] {
  const orbitClasses = new Set(filters.orbitClasses)
  const objectTypes = new Set(filters.objectTypes)
  const countryCodes = new Set(filters.countryCodes)

  return satellites.filter(
    (satellite) =>
      (orbitClasses.size === 0 || orbitClasses.has(satellite.orbitClass)) &&
      (objectTypes.size === 0 ||
        (satellite.objectType !== null && objectTypes.has(satellite.objectType))) &&
      (countryCodes.size === 0 ||
        (satellite.countryCode !== null &&
          countryCodes.has(satellite.countryCode))),
  )
}

export function filterByVisibleIds<T extends { id: string }>(
  values: T[],
  visibleIds: ReadonlySet<string>,
): T[] {
  return values.filter((value) => visibleIds.has(value.id))
}
