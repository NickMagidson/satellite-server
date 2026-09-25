import type { SatRec } from 'satellite.js'

/**
 * SGP4 scales the semi-major axis by the square of a drag polynomial in time.
 * satellite.js only reports decay while the resulting radius is below Earth's,
 * so once the polynomial passes zero, stale elements yield huge bogus orbits.
 * Reads `satrec.t`, so call it after `satellite.propagate`.
 */
export function hasPassedDragDecay(satrec: SatRec): boolean {
  const { t } = satrec
  let tempa = 1 - satrec.cc1 * t

  if (satrec.isimp !== 1) {
    tempa -= satrec.d2 * t ** 2 + satrec.d3 * t ** 3 + satrec.d4 * t ** 4
  }

  return tempa <= 0
}
