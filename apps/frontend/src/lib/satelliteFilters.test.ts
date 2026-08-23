import { afterEach, describe, expect, it, vi } from 'vitest'
import type { OrbitClass, SatelliteMetadata } from './satelliteApi'
import {
  SATELLITE_FILTERS_STORAGE_KEY,
  applyFilters,
  extractUniqueCountryCodes,
  extractUniqueObjectTypes,
  extractUniqueOrbitClasses,
  filterByVisibleIds,
  getDefaultFilters,
  loadFiltersFromStorage,
  reconcileFiltersWithCatalog,
  saveFiltersToStorage,
} from './satelliteFilters'

function satellite(
  id: string,
  orbitClass: OrbitClass,
  objectType: string | null,
  countryCode: string | null,
): SatelliteMetadata {
  return {
    id,
    name: id,
    noradCatId: id,
    objectId: null,
    epoch: '2026-01-01T00:00:00.000Z',
    classification: null,
    meanMotion: 1,
    inclinationDeg: 0,
    eccentricity: 0,
    orbitClass,
    objectType,
    countryCode,
    launchDate: null,
    launchSite: null,
    rcsSize: null,
    periodMin: null,
    apoapsisKm: null,
    periapsisKm: null,
  }
}

const catalog = [
  satellite('one', 'LEO', 'PAYLOAD', 'US'),
  satellite('two', 'LEO', 'DEBRIS', 'RU'),
  satellite('three', 'GEO', 'PAYLOAD', 'US'),
  satellite('four', 'HEO', null, null),
]

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('applyFilters', () => {
  it('returns all satellites when every category is unrestricted', () => {
    expect(applyFilters(catalog, getDefaultFilters())).toEqual(catalog)
  })

  it('uses OR within a category and AND across categories', () => {
    const filtered = applyFilters(catalog, {
      orbitClasses: ['LEO', 'GEO'],
      objectTypes: ['PAYLOAD'],
      countryCodes: ['US'],
    })

    expect(filtered.map(({ id }) => id)).toEqual(['one', 'three'])
  })

  it('does not match null metadata when its category is constrained', () => {
    expect(
      applyFilters(catalog, {
        orbitClasses: [],
        objectTypes: ['PAYLOAD'],
        countryCodes: [],
      }).map(({ id }) => id),
    ).not.toContain('four')
  })
})

describe('catalog filter options', () => {
  it('extracts deterministic non-null options', () => {
    expect(extractUniqueOrbitClasses(catalog)).toEqual(['LEO', 'GEO', 'HEO'])
    expect(extractUniqueObjectTypes(catalog)).toEqual(['DEBRIS', 'PAYLOAD'])
    expect(extractUniqueCountryCodes(catalog)).toEqual(['RU', 'US'])
  })

  it('removes persisted values that are absent from the catalog', () => {
    expect(
      reconcileFiltersWithCatalog(
        {
          orbitClasses: ['LEO', 'MEO'],
          objectTypes: ['PAYLOAD', 'ROCKET BODY'],
          countryCodes: ['US', 'CN'],
        },
        catalog,
      ),
    ).toEqual({
      orbitClasses: ['LEO'],
      objectTypes: ['PAYLOAD'],
      countryCodes: ['US'],
    })
  })

  it('joins filtered metadata to worker elements by shared ID', () => {
    const visibleIds = new Set(
      applyFilters(catalog, {
        orbitClasses: ['GEO'],
        objectTypes: [],
        countryCodes: [],
      }).map(({ id }) => id),
    )
    const elements = [
      { id: 'one', name: 'One' },
      { id: 'three', name: 'Three' },
      { id: 'missing-from-metadata', name: 'Missing' },
    ]

    expect(filterByVisibleIds(elements, visibleIds)).toEqual([
      { id: 'three', name: 'Three' },
    ])
  })
})

describe('filter storage', () => {
  function stubStorage(initialValue: string | null = null) {
    let value = initialValue
    const localStorage = {
      getItem: vi.fn(() => value),
      setItem: vi.fn((_key: string, nextValue: string) => {
        value = nextValue
      }),
    }
    vi.stubGlobal('window', { localStorage })
    return localStorage
  }

  it('returns defaults without browser storage', () => {
    expect(loadFiltersFromStorage()).toEqual(getDefaultFilters())
  })

  it('persists and loads validated filters', () => {
    const localStorage = stubStorage()
    const filters = {
      orbitClasses: ['LEO'] as OrbitClass[],
      objectTypes: ['PAYLOAD'],
      countryCodes: ['US'],
    }

    saveFiltersToStorage(filters)

    expect(localStorage.setItem).toHaveBeenCalledWith(
      SATELLITE_FILTERS_STORAGE_KEY,
      JSON.stringify(filters),
    )
    expect(loadFiltersFromStorage()).toEqual(filters)
  })

  it('falls back safely for malformed storage data', () => {
    stubStorage('{not-json')
    expect(loadFiltersFromStorage()).toEqual(getDefaultFilters())
  })

  it('drops invalid stored values', () => {
    stubStorage(
      JSON.stringify({
        orbitClasses: ['LEO', 'INVALID'],
        objectTypes: ['PAYLOAD', 2],
        countryCodes: 'US',
      }),
    )

    expect(loadFiltersFromStorage()).toEqual({
      orbitClasses: ['LEO'],
      objectTypes: ['PAYLOAD'],
      countryCodes: [],
    })
  })
})
