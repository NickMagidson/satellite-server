const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export interface GeodeticPosition {
  latitudeDeg: number
  longitudeDeg: number
  altitudeKm: number
}

export interface VectorKm {
  xKm: number
  yKm: number
  zKm: number
}

export interface SatellitePositionOk {
  id: string
  name: string
  status: 'ok'
  propagatedAt: string
  geodetic: GeodeticPosition
  ecf: VectorKm
}

export interface SatellitePositionFailed {
  id: string
  name: string
  status: 'propagation_failed'
  errorCode: number
  propagatedAt: string
}

export type SatellitePosition = SatellitePositionOk | SatellitePositionFailed

export interface SatelliteSnapshot {
  updatedAt: string | null
  propagatedAt: string | null
  updateIntervalMs: number
  count: number
  positions: SatellitePosition[]
}

export type OrbitClass = 'LEO' | 'MEO' | 'GEO' | 'HEO' | 'OTHER'

export const ORBIT_CLASS_LABELS: Record<OrbitClass, string> = {
  LEO: 'Low Earth Orbit',
  MEO: 'Medium Earth Orbit',
  GEO: 'Geosynchronous',
  HEO: 'Highly Elliptical',
  OTHER: 'Other',
}

export interface SatelliteMetadata {
  id: string
  name: string
  noradCatId: string | number
  objectId: string | null
  epoch: string
  classification: string | null
  meanMotion: number
  inclinationDeg: number
  eccentricity: number
  orbitClass: OrbitClass
  objectType: string | null
  countryCode: string | null
  launchDate: string | null
  launchSite: string | null
  rcsSize: string | null
  periodMin: number | null
  apoapsisKm: number | null
  periapsisKm: number | null
}

export interface SatelliteCatalog {
  count: number
  satellites: SatelliteMetadata[]
}

export async function fetchSatellites(): Promise<SatelliteCatalog> {
  const response = await fetch(`${API_BASE}/api/satellites`)

  if (!response.ok) {
    throw new Error(`Failed to fetch satellites (${response.status})`)
  }

  return response.json() as Promise<SatelliteCatalog>
}

export async function fetchSatellitePositions(): Promise<SatelliteSnapshot> {
  const response = await fetch(`${API_BASE}/api/satellites/positions`)

  if (!response.ok) {
    throw new Error(`Failed to fetch satellite positions (${response.status})`)
  }

  return response.json() as Promise<SatelliteSnapshot>
}

export function isSatellitePositionOk(
  position: SatellitePosition,
): position is SatellitePositionOk {
  return position.status === 'ok'
}
