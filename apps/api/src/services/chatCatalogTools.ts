import type {
  OrbitClass,
  SatelliteMetadata,
  SatellitePosition,
} from '../types.js';
import type { SatelliteCatalog } from './satelliteCatalog.js';

export interface ChatFilters {
  orbitClasses: OrbitClass[];
  objectTypes: string[];
  countryCodes: string[];
}

export type ChatSceneAction =
  | { type: 'selectSatellite'; id: string }
  | { type: 'patchFilters'; patch: Partial<ChatFilters> }
  | { type: 'resetFilters' };

export function searchSatellites(
  catalog: SatelliteCatalog,
  query: string,
  limit: number,
): SatelliteMetadata[] {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return [];

  const count = Math.min(
    20,
    Math.max(1, Number.isFinite(limit) ? Math.trunc(limit) : 20),
  );
  return catalog
    .getSatellites()
    .filter((satellite) =>
      [
        satellite.name,
        satellite.id,
        satellite.noradCatId,
        satellite.objectId,
      ].some((field) =>
        String(field ?? '')
          .toLocaleLowerCase()
          .includes(normalized),
      ),
    )
    .slice(0, count);
}

export function getSatelliteDetails(
  catalog: SatelliteCatalog,
  id: string,
): SatelliteMetadata | null {
  return (
    catalog.getSatellites().find((satellite) => satellite.id === id) ?? null
  );
}

export function getCurrentPosition(
  catalog: SatelliteCatalog,
  id: string,
  at: Date = new Date(),
): {
  satellite: SatelliteMetadata;
  position: SatellitePosition;
  elementEpoch: string;
  elementAgeDays: number;
} | null {
  const satellite = getSatelliteDetails(catalog, id);
  if (!satellite) return null;

  return {
    satellite,
    position: catalog.getPosition(id, at),
    elementEpoch: satellite.epoch,
    elementAgeDays:
      (at.getTime() - new Date(satellite.epoch).getTime()) / 86_400_000,
  };
}

export function validateSceneAction(
  catalog: SatelliteCatalog,
  input: unknown,
): ChatSceneAction | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const action = input as Record<string, unknown>;

  if (action.type === 'resetFilters') {
    return Object.keys(action).length === 1 ? { type: 'resetFilters' } : null;
  }
  if (action.type === 'selectSatellite') {
    if (
      Object.keys(action).length !== 2 ||
      typeof action.id !== 'string' ||
      !getSatelliteDetails(catalog, action.id)
    )
      return null;
    return { type: 'selectSatellite', id: action.id };
  }
  if (
    action.type !== 'patchFilters' ||
    Object.keys(action).length !== 2 ||
    !action.patch ||
    typeof action.patch !== 'object' ||
    Array.isArray(action.patch)
  )
    return null;

  const patch = action.patch as Record<string, unknown>;
  const keys = Object.keys(patch);
  if (
    keys.length === 0 ||
    keys.some(
      (key) => !['orbitClasses', 'objectTypes', 'countryCodes'].includes(key),
    )
  )
    return null;
  const satellites = catalog.getSatellites();
  const available: Record<keyof ChatFilters, Set<string>> = {
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
  };
  for (const key of keys as (keyof ChatFilters)[]) {
    const values = patch[key];
    if (
      !Array.isArray(values) ||
      values.some(
        (value) => typeof value !== 'string' || !available[key].has(value),
      )
    )
      return null;
  }

  return { type: 'patchFilters', patch: patch as Partial<ChatFilters> };
}
