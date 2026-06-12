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
