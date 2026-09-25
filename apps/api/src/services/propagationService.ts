import * as satellite from 'satellite.js';
import type { SatelliteEntry, SatellitePosition } from '../types.js';

/**
 * SGP4 scales the semi-major axis by the square of a drag polynomial in time.
 * satellite.js only reports decay while the resulting radius is below Earth's,
 * so once the polynomial passes zero, stale elements yield huge bogus orbits.
 * Reads `satrec.t`, so call it after `satellite.propagate`.
 */
export function hasPassedDragDecay(satrec: satellite.SatRec): boolean {
  const { t } = satrec;
  let tempa = 1 - satrec.cc1 * t;

  if (satrec.isimp !== 1) {
    tempa -= satrec.d2 * t ** 2 + satrec.d3 * t ** 3 + satrec.d4 * t ** 4;
  }

  return tempa <= 0;
}

export function propagateSatellite(entry: SatelliteEntry, date: Date): SatellitePosition {
  const positionAndVelocity = satellite.propagate(entry.satrec, date);
  const decayed = positionAndVelocity?.position && hasPassedDragDecay(entry.satrec);

  if (!positionAndVelocity?.position || decayed) {
    return {
      id: entry.id,
      name: entry.name,
      status: 'propagation_failed',
      errorCode: decayed ? satellite.SatRecError.Decayed : entry.satrec.error,
      propagatedAt: date.toISOString(),
    };
  }

  const gmst = satellite.gstime(date);
  const geodetic = satellite.eciToGeodetic(positionAndVelocity.position, gmst);
  const ecf = satellite.eciToEcf(positionAndVelocity.position, gmst);

  return {
    id: entry.id,
    name: entry.name,
    status: 'ok',
    propagatedAt: date.toISOString(),
    geodetic: {
      latitudeDeg: satellite.degreesLat(geodetic.latitude),
      longitudeDeg: satellite.degreesLong(geodetic.longitude),
      altitudeKm: geodetic.height,
    },
    eci: {
      xKm: positionAndVelocity.position.x,
      yKm: positionAndVelocity.position.y,
      zKm: positionAndVelocity.position.z,
    },
    ecf: {
      xKm: ecf.x,
      yKm: ecf.y,
      zKm: ecf.z,
    },
    velocityEci: positionAndVelocity.velocity
      ? {
          xKmPerSec: positionAndVelocity.velocity.x,
          yKmPerSec: positionAndVelocity.velocity.y,
          zKmPerSec: positionAndVelocity.velocity.z,
        }
      : null,
  };
}
