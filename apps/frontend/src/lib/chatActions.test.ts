import { describe, expect, it } from 'vitest'
import type { SatelliteMetadata } from './satelliteApi'
import { getDefaultFilters } from './satelliteFilters'
import { applyChatActions } from './chatActions'
import type { ChatWorkspaceState } from './chatActions'

const satellites = [
  {
    id: '25544',
    name: 'ISS SAMPLE',
    orbitClass: 'LEO',
    objectType: 'PAYLOAD',
    countryCode: 'US',
  },
  {
    id: '28492',
    name: 'HELIOS',
    orbitClass: 'MEO',
    objectType: 'DEBRIS',
    countryCode: 'FR',
  },
] as SatelliteMetadata[]

describe('applyChatActions', () => {
  const current = { selectedSatelliteId: null, filters: getDefaultFilters() }

  it('applies valid selection, partial patches, and reset in order', () => {
    const initial: ChatWorkspaceState = {
      selectedSatelliteId: null,
      filters: { orbitClasses: [], objectTypes: [], countryCodes: ['US'] },
    }
    const patched = applyChatActions(
      [{ type: 'patchFilters', patch: { orbitClasses: ['LEO'] } }],
      initial,
      satellites,
    )
    expect(patched.filters).toEqual({
      orbitClasses: ['LEO'],
      objectTypes: [],
      countryCodes: ['US'],
    })
    expect(
      applyChatActions(
        [{ type: 'selectSatellite', id: '25544' }],
        patched,
        satellites,
      ).selectedSatelliteId,
    ).toBe('25544')
    expect(
      applyChatActions([{ type: 'resetFilters' }], patched, satellites).filters,
    ).toEqual(getDefaultFilters())
  })

  it('ignores unknown IDs and filter values, including a mixed valid and invalid patch', () => {
    expect(
      applyChatActions(
        [{ type: 'selectSatellite', id: 'missing' }],
        current,
        satellites,
      ),
    ).toEqual(current)
    expect(
      applyChatActions(
        [{ type: 'patchFilters', patch: { countryCodes: ['UNKNOWN'] } }],
        current,
        satellites,
      ),
    ).toEqual(current)
    expect(
      applyChatActions(
        [
          {
            type: 'patchFilters',
            patch: { orbitClasses: ['LEO'], objectTypes: ['UNKNOWN'] },
          },
        ],
        current,
        satellites,
      ),
    ).toEqual(current)
  })

  it('clears only filter categories that hide a newly selected satellite', () => {
    const initial: ChatWorkspaceState = {
      selectedSatelliteId: null,
      filters: {
        orbitClasses: ['MEO'],
        objectTypes: ['DEBRIS'],
        countryCodes: ['US'],
      },
    }
    const next = applyChatActions(
      [{ type: 'selectSatellite', id: '25544' }],
      initial,
      satellites,
    )
    expect(next).toEqual({
      selectedSatelliteId: '25544',
      filters: { orbitClasses: [], objectTypes: [], countryCodes: ['US'] },
    })
  })
})
