import * as satellite from 'satellite.js';
import type { SatelliteEntry, SatellitePosition } from '../types.js';

export function propagateSatellite(entry: SatelliteEntry, date: Date): SatellitePosition {
  const positionAndVelocity = satellite.propagate(entry.satrec, date);

  if (!positionAndVelocity?.position) {
    return {
      id: entry.id,
      name: entry.name,
      status: 'propagation_failed',
      errorCode: entry.satrec.error,
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
