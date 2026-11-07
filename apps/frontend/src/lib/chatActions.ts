import type { SatelliteMetadata } from './satelliteApi'
import type { ChatSceneAction } from './chatClient'
import { getDefaultFilters } from './satelliteFilters'
import type { SatelliteFilters } from './satelliteFilters'

export interface ChatWorkspaceState {
  selectedSatelliteId: string | null
  filters: SatelliteFilters
}

export function applyChatActions(
  actions: ChatSceneAction[],
  current: ChatWorkspaceState,
  satellites: SatelliteMetadata[],
): ChatWorkspaceState {
  const byId = new Map(satellites.map((satellite) => [satellite.id, satellite]))
  const available: Record<keyof SatelliteFilters, Set<string>> = {
    orbitClasses: new Set(satellites.map((satellite) => satellite.orbitClass)),
    objectTypes: new Set(
      satellites.flatMap((satellite) =>
        satellite.objectType ? [satellite.objectType] : [],
      ),
    ),
    countryCodes: new Set(
      satellites.flatMap((satellite) =>
        satellite.countryCode ? [satellite.countryCode] : [],
      ),
    ),
  }
  let state = current

  for (const action of actions.slice(0, 3)) {
    if (action.type === 'resetFilters') {
      if (Object.keys(action).length === 1)
        state = { ...state, filters: getDefaultFilters() }
      continue
    }
    if (action.type === 'selectSatellite') {
      const satellite =
        typeof action.id === 'string' && Object.keys(action).length === 2
          ? byId.get(action.id)
          : null
      if (!satellite) continue
      const filters = { ...state.filters }
      if (
        filters.orbitClasses.length &&
        !filters.orbitClasses.includes(satellite.orbitClass)
      )
        filters.orbitClasses = []
      if (
        filters.objectTypes.length &&
        (!satellite.objectType ||
          !filters.objectTypes.includes(satellite.objectType))
      )
        filters.objectTypes = []
      if (
        filters.countryCodes.length &&
        (!satellite.countryCode ||
          !filters.countryCodes.includes(satellite.countryCode))
      )
        filters.countryCodes = []
      state = { selectedSatelliteId: satellite.id, filters }
      continue
    }
    const patch = action.patch
    const keys = Object.keys(patch) as (keyof SatelliteFilters)[]
    if (!keys.length || keys.some((key) => !Object.hasOwn(available, key)))
      continue
    if (
      keys.some(
        (key) =>
          !Array.isArray(patch[key]) ||
          patch[key].some((value) => !available[key].has(value)),
      )
    )
      continue
    state = { ...state, filters: { ...state.filters, ...patch } }
  }
  return state
}
