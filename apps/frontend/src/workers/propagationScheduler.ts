import type { CameraState } from '../lib/satelliteMotion/types'

export const IN_FOV_INTERVAL_MS = 1000
export const BELOW_HORIZON_INTERVAL_MS = 4000
export const OFFSCREEN_MIN_INTERVAL_MS = 2000
export const OFFSCREEN_MAX_INTERVAL_MS = 4000
export const IN_FOV_HALF_ANGLE_RAD = (45 * Math.PI) / 180

export type PropagationTier = 'selected' | 'in_fov' | 'offscreen' | 'below_horizon'

export interface EcfKm {
  x: number
  y: number
  z: number
}

function normalize(x: number, y: number, z: number): [number, number, number] | null {
  const length = Math.hypot(x, y, z)
  if (length === 0) {
    return null
  }
  return [x / length, y / length, z / length]
}

function dot(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

/** True when the satellite lies within ~45° of the camera look vector. */
export function isInFov(camera: CameraState, satEcfKm: EcfKm): boolean {
  const toSat = normalize(
    satEcfKm.x - camera.positionEcfKm[0],
    satEcfKm.y - camera.positionEcfKm[1],
    satEcfKm.z - camera.positionEcfKm[2],
  )
  const direction = normalize(
    camera.directionEcf[0],
    camera.directionEcf[1],
    camera.directionEcf[2],
  )
  if (!toSat || !direction) {
    return false
  }

  return dot(toSat, direction) >= Math.cos(IN_FOV_HALF_ANGLE_RAD)
}

/**
 * Surface-style elevation check: satellite is above the local horizon when the
 * line-of-sight has a non-negative component along the camera radial (up).
 */
export function isAboveHorizon(camera: CameraState, satEcfKm: EcfKm): boolean {
  const up = normalize(
    camera.positionEcfKm[0],
    camera.positionEcfKm[1],
    camera.positionEcfKm[2],
  )
  const toSat = normalize(
    satEcfKm.x - camera.positionEcfKm[0],
    satEcfKm.y - camera.positionEcfKm[1],
    satEcfKm.z - camera.positionEcfKm[2],
  )
  if (!up || !toSat) {
    return false
  }

  return dot(toSat, up) > -0.05
}

/** Stagger off-screen corrections across 2–4s by stable index. */
export function offscreenIntervalMs(index: number): number {
  const steps = 5
  const span = OFFSCREEN_MAX_INTERVAL_MS - OFFSCREEN_MIN_INTERVAL_MS
  return OFFSCREEN_MIN_INTERVAL_MS + ((index % steps) * span) / (steps - 1)
}

export function classifyTier(options: {
  index: number
  selectedIndex: number | null
  camera: CameraState | null
  satEcfKm: EcfKm | null
}): PropagationTier {
  const { index, selectedIndex, camera, satEcfKm } = options

  if (selectedIndex === index) {
    return 'selected'
  }

  if (!camera || !satEcfKm) {
    return 'offscreen'
  }

  if (!isAboveHorizon(camera, satEcfKm)) {
    return 'below_horizon'
  }

  if (isInFov(camera, satEcfKm)) {
    return 'in_fov'
  }

  return 'offscreen'
}

export function intervalForTier(tier: PropagationTier, index: number): number {
  switch (tier) {
    case 'selected':
      return 0
    case 'in_fov':
      return IN_FOV_INTERVAL_MS
    case 'offscreen':
      return offscreenIntervalMs(index)
    case 'below_horizon':
      return BELOW_HORIZON_INTERVAL_MS
  }
}

/** Whether this satellite should run SGP4 on the current worker tick. */
export function shouldRunSgp4(options: {
  index: number
  selectedIndex: number | null
  camera: CameraState | null
  satEcfKm: EcfKm | null
  nowMs: number
  lastSgp4Ms: number
}): boolean {
  const tier = classifyTier(options)
  if (tier === 'selected') {
    return true
  }

  const interval = intervalForTier(tier, options.index)
  return options.nowMs - options.lastSgp4Ms >= interval
}
