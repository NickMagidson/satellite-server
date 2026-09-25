import * as satellite from 'satellite.js'
import type { OMMJsonObject } from 'satellite.js'
import { describe, expect, it } from 'vitest'
import { hasPassedDragDecay } from './sgp4Decay'

const DAY_MS = 86_400_000

const highDragOmm = {
  OBJECT_NAME: 'STARLINK-34709',
  OBJECT_ID: '2025-152C',
  EPOCH: '2026-08-18T06:00:02.000160',
  MEAN_MOTION: 15.14528201,
  ECCENTRICITY: 0.00014535,
  INCLINATION: 97.2831,
  RA_OF_ASC_NODE: 81.2346,
  ARG_OF_PERICENTER: 99.4842,
  MEAN_ANOMALY: 3.5325,
  EPHEMERIS_TYPE: 0,
  CLASSIFICATION_TYPE: 'U',
  NORAD_CAT_ID: 64844,
  ELEMENT_SET_NO: 999,
  REV_AT_EPOCH: 1,
  BSTAR: 0.23005901,
  MEAN_MOTION_DOT: 0.04838248,
  MEAN_MOTION_DDOT: 0,
} as OMMJsonObject

function propagateDaysAfterEpoch(days: number) {
  const satrec = satellite.json2satrec(highDragOmm)
  const date = new Date(Date.parse(`${highDragOmm.EPOCH}Z`) + days * DAY_MS)
  const pv = satellite.propagate(satrec, date)
  return { satrec, pv }
}

describe('hasPassedDragDecay', () => {
  it('is false while high-drag elements are still in orbit', () => {
    const { satrec, pv } = propagateDaysAfterEpoch(2)

    expect(pv?.position).toBeTruthy()
    expect(hasPassedDragDecay(satrec)).toBe(false)
  })

  it('flags the bogus orbit SGP4 returns long after decay', () => {
    const { satrec, pv } = propagateDaysAfterEpoch(38)

    expect(pv?.position).toBeTruthy()
    expect(hasPassedDragDecay(satrec)).toBe(true)
  })
})
