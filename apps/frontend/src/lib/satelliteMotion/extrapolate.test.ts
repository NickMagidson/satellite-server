import { describe, expect, it } from 'vitest'
import {
  FLAG_IN_FOV,
  FLAG_VALID,
  allocateCorrectionTimeBuffer,
  allocateMotionBuffer,
  getFlags,
  hasFlag,
  setFlags,
  writeEciState,
} from './bufferLayout'
import {
  correctionDtSeconds,
  extrapolateEci,
  positionFromMotionBuffer,
} from './extrapolate'

describe('extrapolateEci', () => {
  it('advances position by velocity * dt', () => {
    const result = extrapolateEci(
      { x: 1000, y: 2000, z: 3000 },
      { x: 1, y: -2, z: 0.5 },
      2,
    )

    expect(result).toEqual({ x: 1002, y: 1996, z: 3001 })
  })

  it('returns the same position when dt is zero', () => {
    const position = { x: 10, y: 20, z: 30 }
    expect(extrapolateEci(position, { x: 1, y: 1, z: 1 }, 0)).toEqual(position)
  })
})

describe('flag helpers', () => {
  it('stores and reads uint32 flags via float32 reinterpretation', () => {
    const buffer = allocateMotionBuffer(2)
    setFlags(buffer, 1, FLAG_VALID | FLAG_IN_FOV)

    const flags = getFlags(buffer, 1)
    expect(hasFlag(flags, FLAG_VALID)).toBe(true)
    expect(hasFlag(flags, FLAG_IN_FOV)).toBe(true)
    expect(getFlags(buffer, 0)).toBe(0)
  })
})

describe('positionFromMotionBuffer', () => {
  it('returns null when VALID is unset', () => {
    const buffer = allocateMotionBuffer(1)
    writeEciState(
      buffer,
      0,
      { x: 1, y: 2, z: 3 },
      { x: 0, y: 0, z: 0 },
      0,
    )

    expect(
      positionFromMotionBuffer(buffer, 0, 0, new Date('2025-03-26T06:00:00Z')),
    ).toBeNull()
  })

  it('returns ECF meters for a valid entry', () => {
    const buffer = allocateMotionBuffer(1)
    writeEciState(
      buffer,
      0,
      { x: 5000, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 },
      FLAG_VALID,
    )

    const position = positionFromMotionBuffer(
      buffer,
      0,
      0,
      new Date('2025-03-26T06:00:00Z'),
    )

    expect(position).not.toBeNull()
    expect(Number.isFinite(position!.x)).toBe(true)
    expect(Number.isFinite(position!.y)).toBe(true)
    expect(Number.isFinite(position!.z)).toBe(true)
    // ECF is in meters; magnitude should be on the order of thousands of km.
    const magnitudeM = Math.hypot(position!.x, position!.y, position!.z)
    expect(magnitudeM).toBeGreaterThan(4_000_000)
    expect(magnitudeM).toBeLessThan(8_000_000)
  })
})

describe('correctionDtSeconds', () => {
  it('computes non-negative seconds between correction and now', () => {
    expect(correctionDtSeconds(1000, 2500)).toBe(1.5)
    expect(correctionDtSeconds(3000, 2500)).toBe(0)
  })

  it('supports per-satellite correction epochs', () => {
    const correctionTimes = allocateCorrectionTimeBuffer(3)
    correctionTimes[0] = 1000
    correctionTimes[1] = 2000
    correctionTimes[2] = 500

    expect(correctionDtSeconds(correctionTimes[0], 2500)).toBe(1.5)
    expect(correctionDtSeconds(correctionTimes[1], 2500)).toBe(0.5)
    expect(correctionDtSeconds(correctionTimes[2], 2500)).toBe(2)
  })
})

describe('positionFromMotionBuffer with extrapolation', () => {
  it('advances ECF when dt is non-zero', () => {
    const buffer = allocateMotionBuffer(1)
    writeEciState(
      buffer,
      0,
      { x: 5000, y: 0, z: 0 },
      { x: 7.5, y: 0, z: 0 },
      FLAG_VALID,
    )
    const date = new Date('2025-03-26T06:00:00Z')

    const atCorrection = positionFromMotionBuffer(buffer, 0, 0, date)
    const afterOneSecond = positionFromMotionBuffer(buffer, 0, 1, date)

    expect(atCorrection).not.toBeNull()
    expect(afterOneSecond).not.toBeNull()
    expect(afterOneSecond!.x).not.toBe(atCorrection!.x)
  })
})
