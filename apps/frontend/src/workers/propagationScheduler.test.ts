import { describe, expect, it } from 'vitest'
import type { CameraState } from '../lib/satelliteMotion/types'
import {
  BELOW_HORIZON_INTERVAL_MS,
  IN_FOV_INTERVAL_MS,
  classifyTier,
  intervalForTier,
  isAboveHorizon,
  isInFov,
  offscreenIntervalMs,
  shouldRunSgp4,
} from './propagationScheduler'

const cameraLookingEast: CameraState = {
  positionEcfKm: [7000, 0, 0],
  directionEcf: [0, 1, 0],
}

describe('isInFov', () => {
  it('returns true for a satellite along the look vector', () => {
    expect(isInFov(cameraLookingEast, { x: 7000, y: 500, z: 0 })).toBe(true)
  })

  it('returns false for a satellite far from the look vector', () => {
    expect(isInFov(cameraLookingEast, { x: 7000, y: 0, z: 500 })).toBe(false)
  })
})

describe('isAboveHorizon', () => {
  it('returns true for a satellite outward from the camera radial', () => {
    expect(isAboveHorizon(cameraLookingEast, { x: 7500, y: 100, z: 0 })).toBe(
      true,
    )
  })

  it('returns false for a satellite toward Earth center from the camera', () => {
    expect(isAboveHorizon(cameraLookingEast, { x: 1000, y: 0, z: 0 })).toBe(
      false,
    )
  })
})

describe('classifyTier / shouldRunSgp4', () => {
  it('always classifies the selected index as selected', () => {
    expect(
      classifyTier({
        index: 2,
        selectedIndex: 2,
        camera: cameraLookingEast,
        satEcfKm: { x: 1000, y: 0, z: 0 },
      }),
    ).toBe('selected')
  })

  it('runs SGP4 every frame for the selected satellite', () => {
    expect(
      shouldRunSgp4({
        index: 0,
        selectedIndex: 0,
        camera: null,
        satEcfKm: null,
        nowMs: 100,
        lastSgp4Ms: 99,
      }),
    ).toBe(true)
  })

  it('uses the in-FOV interval for satellites in view', () => {
    expect(intervalForTier('in_fov', 0)).toBe(IN_FOV_INTERVAL_MS)
    expect(
      shouldRunSgp4({
        index: 1,
        selectedIndex: null,
        camera: cameraLookingEast,
        satEcfKm: { x: 7000, y: 500, z: 0 },
        nowMs: 1000,
        lastSgp4Ms: 0,
      }),
    ).toBe(true)
    expect(
      shouldRunSgp4({
        index: 1,
        selectedIndex: null,
        camera: cameraLookingEast,
        satEcfKm: { x: 7000, y: 500, z: 0 },
        nowMs: 500,
        lastSgp4Ms: 0,
      }),
    ).toBe(false)
  })

  it('staggers off-screen intervals between 2s and 4s', () => {
    const intervals = [0, 1, 2, 3, 4].map(offscreenIntervalMs)
    expect(Math.min(...intervals)).toBe(2000)
    expect(Math.max(...intervals)).toBe(4000)
  })

  it('uses the below-horizon interval when occulted', () => {
    expect(intervalForTier('below_horizon', 0)).toBe(BELOW_HORIZON_INTERVAL_MS)
    expect(
      classifyTier({
        index: 0,
        selectedIndex: null,
        camera: cameraLookingEast,
        satEcfKm: { x: 1000, y: 0, z: 0 },
      }),
    ).toBe('below_horizon')
  })
})
