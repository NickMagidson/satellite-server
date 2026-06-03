import type { SatRec } from 'satellite.js';

export const REQUIRED_NUMBER_FIELDS = [
  'MEAN_MOTION',
  'ECCENTRICITY',
  'INCLINATION',
  'RA_OF_ASC_NODE',
  'ARG_OF_PERICENTER',
  'MEAN_ANOMALY',
  'BSTAR',
  'MEAN_MOTION_DOT',
  'MEAN_MOTION_DDOT',
] as const;

export type RequiredNumberField = (typeof REQUIRED_NUMBER_FIELDS)[number];

export type OmmIdentifier = string | number;

export type NormalizedOmmRecord = {
  EPOCH: string;
  NORAD_CAT_ID: OmmIdentifier;
  OBJECT_ID?: string;
  OBJECT_NAME?: string;
  CLASSIFICATION_TYPE?: string;
  EPHEMERIS_TYPE?: 0 | '0';
  ELEMENT_SET_NO?: OmmIdentifier;
  REV_AT_EPOCH?: OmmIdentifier;
} & Record<RequiredNumberField, number> &
  Record<string, unknown>;

export interface ValidationIssue {
  index: number;
  field?: string;
  message: string;
}

export interface SatelliteEntry {
  id: string;
  name: string;
  omm: NormalizedOmmRecord;
  satrec: SatRec;
}

export interface SatelliteMetadata {
  id: string;
  name: string;
  noradCatId: OmmIdentifier;
  objectId: string | null;
  epoch: string;
  classification: string | null;
  meanMotion: number;
  inclinationDeg: number;
  eccentricity: number;
}

export interface VectorKm {
  xKm: number;
  yKm: number;
  zKm: number;
}

export interface VelocityVectorKmPerSec {
  xKmPerSec: number;
  yKmPerSec: number;
  zKmPerSec: number;
}

export interface GeodeticPosition {
  latitudeDeg: number;
  longitudeDeg: number;
  altitudeKm: number;
}

export interface SatellitePositionOk {
  id: string;
  name: string;
  status: 'ok';
  propagatedAt: string;
  geodetic: GeodeticPosition;
  eci: VectorKm;
  ecf: VectorKm;
  velocityEci: VelocityVectorKmPerSec | null;
}

export interface SatellitePositionFailed {
  id: string;
  name: string;
  status: 'propagation_failed';
  errorCode: number;
  propagatedAt: string;
}

export type SatellitePosition = SatellitePositionOk | SatellitePositionFailed;

export interface SatelliteSnapshot {
  updatedAt: string | null;
  propagatedAt: string | null;
  updateIntervalMs: number;
  count: number;
  positions: SatellitePosition[];
}
