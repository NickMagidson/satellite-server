import type { GeodeticPosition } from '../satelliteApi'

/** Validated OMM fields needed by satellite.js `json2satrec`. */
export type SatelliteOmmRecord = Record<string, unknown> & {
  EPOCH: string
  NORAD_CAT_ID: string | number
  MEAN_MOTION: number
  ECCENTRICITY: number
  INCLINATION: number
  RA_OF_ASC_NODE: number
  ARG_OF_PERICENTER: number
  MEAN_ANOMALY: number
  BSTAR: number
  MEAN_MOTION_DOT: number
  MEAN_MOTION_DDOT: number
}

export interface SatelliteElement {
  id: string
  name: string
  omm: SatelliteOmmRecord
}

export interface SatelliteElementsResponse {
  count: number
  elements: SatelliteElement[]
}

/** Camera pose in Earth-fixed coordinates (km / unit direction). */
export interface CameraState {
  positionEcfKm: [number, number, number]
  directionEcf: [number, number, number]
}

export interface SelectedPositionDetail {
  id: string
  name: string
  geodetic: GeodeticPosition
  propagatedAt: string
}

export type MainToWorkerMessage =
  | {
      type: 'INIT'
      elements: SatelliteElement[]
      buffer: Float32Array
      correctionTime: Float64Array
    }
  | {
      type: 'RELOAD'
      elements: SatelliteElement[]
      buffer: Float32Array
      correctionTime: Float64Array
    }
  | {
      type: 'CAMERA'
      camera: CameraState
    }
  | {
      type: 'SET_SELECTED'
      selectedIndex: number | null
    }
  | {
      type: 'RETURN_BUFFER'
      buffer: Float32Array
      correctionTime: Float64Array
    }

export type WorkerToMainMessage =
  | {
      type: 'BUFFER'
      buffer: Float32Array
      correctionTime: Float64Array
    }
  | {
      type: 'SELECTED_DETAIL'
      detail: SelectedPositionDetail
    }
  | {
      type: 'ERROR'
      message: string
    }
