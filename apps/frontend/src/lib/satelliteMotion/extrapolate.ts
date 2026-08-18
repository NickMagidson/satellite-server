import { eciToEcf, gstime } from 'satellite.js'
import {
  FLAG_VALID,
  hasFlag,
  readEciState,
} from './bufferLayout'

export interface EciVectorKm {
  x: number
  y: number
  z: number
}

export interface EcfMeters {
  x: number
  y: number
  z: number
}

/** Linear ECI extrapolation: position += velocity * dtSeconds. */
export function extrapolateEci(
  positionKm: EciVectorKm,
  velocityKmPerSec: EciVectorKm,
  dtSeconds: number,
): EciVectorKm {
  return {
    x: positionKm.x + velocityKmPerSec.x * dtSeconds,
    y: positionKm.y + velocityKmPerSec.y * dtSeconds,
    z: positionKm.z + velocityKmPerSec.z * dtSeconds,
  }
}

/** Convert ECI km to ECF meters at the given epoch. */
export function eciKmToEcfMeters(
  positionKm: EciVectorKm,
  date: Date,
): EcfMeters {
  const gmst = gstime(date)
  const ecfKm = eciToEcf(positionKm, gmst)
  return {
    x: ecfKm.x * 1000,
    y: ecfKm.y * 1000,
    z: ecfKm.z * 1000,
  }
}

/**
 * Read one satellite from the motion buffer, extrapolate ECI by dtSeconds,
 * and convert to ECF meters. Returns null when the VALID flag is unset.
 */
export function positionFromMotionBuffer(
  buffer: Float32Array,
  satelliteIndex: number,
  dtSeconds: number,
  date: Date,
): EcfMeters | null {
  const state = readEciState(buffer, satelliteIndex)
  if (!hasFlag(state.flags, FLAG_VALID)) {
    return null
  }

  const eci = extrapolateEci(
    state.positionKm,
    state.velocityKmPerSec,
    dtSeconds,
  )
  return eciKmToEcfMeters(eci, date)
}

/** Wall-clock ms aligned with worker `performance.timeOrigin + performance.now()`. */
export function nowMs(): number {
  return performance.timeOrigin + performance.now()
}

export function correctionDtSeconds(
  correctionTimeMs: number,
  atMs: number = nowMs(),
): number {
  if (!Number.isFinite(correctionTimeMs)) {
    return 0
  }
  return Math.max(0, (atMs - correctionTimeMs) / 1000)
}
