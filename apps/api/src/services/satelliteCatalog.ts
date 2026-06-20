import * as satellite from 'satellite.js';
import { HttpError } from '../errors.js';
import { propagateSatellite } from './propagationService.js';
import { validateAndNormalizeOmms } from '../validation/ommValidation.js';
import type {
  NormalizedOmmRecord,
  OrbitClass,
  SatelliteEntry,
  SatelliteMetadata,
  SatellitePosition,
  SatelliteSnapshot,
} from '../types.js';

const DEFAULT_UPDATE_INTERVAL_MS = 1000;

interface SatelliteCatalogOptions {
  updateIntervalMs?: number;
}

function getSatelliteId(omm: NormalizedOmmRecord, index: number): string {
  return String(
    omm.NORAD_CAT_ID ??
      omm.OBJECT_ID ??
      omm.OBJECT_NAME ??
      `satellite-${index + 1}`,
  );
}

function getSatelliteName(omm: NormalizedOmmRecord, id: string): string {
  return String(omm.OBJECT_NAME ?? omm.OBJECT_ID ?? id);
}

function getNullableString(value: unknown): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  return String(value);
}

function getNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function getOrbitalPeriodMin(omm: NormalizedOmmRecord): number {
  return getNullableNumber(omm.PERIOD) ?? 1440 / omm.MEAN_MOTION;
}

function classifyOrbit(omm: NormalizedOmmRecord): OrbitClass {
  const eccentricity = omm.ECCENTRICITY;
  const periodMin = getOrbitalPeriodMin(omm);

  if (eccentricity >= 0.25) {
    return 'HEO';
  }

  if (periodMin < 128) {
    return 'LEO';
  }

  if (periodMin >= 1300 && periodMin <= 1600) {
    return 'GEO';
  }

  if (periodMin > 0) {
    return 'MEO';
  }

  return 'OTHER';
}

function toMetadata(entry: SatelliteEntry): SatelliteMetadata {
  return {
    id: entry.id,
    name: entry.name,
    noradCatId: entry.omm.NORAD_CAT_ID,
    objectId: entry.omm.OBJECT_ID ?? null,
    epoch: entry.omm.EPOCH,
    classification: entry.omm.CLASSIFICATION_TYPE ?? null,
    meanMotion: entry.omm.MEAN_MOTION,
    inclinationDeg: entry.omm.INCLINATION,
    eccentricity: entry.omm.ECCENTRICITY,
    orbitClass: classifyOrbit(entry.omm),
    objectType: getNullableString(entry.omm.OBJECT_TYPE),
    countryCode: getNullableString(entry.omm.COUNTRY_CODE),
    launchDate: getNullableString(entry.omm.LAUNCH_DATE),
    launchSite: getNullableString(entry.omm.SITE),
    rcsSize: getNullableString(entry.omm.RCS_SIZE),
    periodMin: getOrbitalPeriodMin(entry.omm),
    apoapsisKm: getNullableNumber(entry.omm.APOAPSIS),
    periapsisKm: getNullableNumber(entry.omm.PERIAPSIS),
  };
}

export class SatelliteCatalog {
  private readonly updateIntervalMs: number;
  private entries: SatelliteEntry[];
  private currentPositions: SatellitePosition[];
  private updatedAt: string | null;
  private interval: NodeJS.Timeout | null;

  constructor({ updateIntervalMs = DEFAULT_UPDATE_INTERVAL_MS }: SatelliteCatalogOptions = {}) {
    this.updateIntervalMs = updateIntervalMs;
    this.entries = [];
    this.currentPositions = [];
    this.updatedAt = null;
    this.interval = null;
  }

  loadOmms(payload: unknown): number {
    const omms = validateAndNormalizeOmms(payload);

    this.entries = omms.map((omm, index) => {
      const id = getSatelliteId(omm, index);

      return {
        id,
        name: getSatelliteName(omm, id),
        omm,
        satrec: satellite.json2satrec(omm as satellite.OMMJsonObject),
      };
    });

    this.updateCurrentPositions();
    return this.entries.length;
  }

  start(): void {
    this.stop();
    this.interval = setInterval(() => this.updateCurrentPositions(), this.updateIntervalMs);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  updateCurrentPositions(date = new Date()): SatellitePosition[] {
    this.currentPositions = this.entries.map((entry) => propagateSatellite(entry, date));
    this.updatedAt = new Date().toISOString();
    return this.currentPositions;
  }

  getSatellites(): SatelliteMetadata[] {
    return this.entries.map(toMetadata);
  }

  getCurrentSnapshot(): SatelliteSnapshot {
    return {
      updatedAt: this.updatedAt,
      propagatedAt: this.currentPositions[0]?.propagatedAt ?? null,
      updateIntervalMs: this.updateIntervalMs,
      count: this.currentPositions.length,
      positions: this.currentPositions,
    };
  }

  getPositionsAt(date: Date): SatelliteSnapshot {
    const generatedAt = new Date().toISOString();

    return {
      updatedAt: generatedAt,
      propagatedAt: date.toISOString(),
      updateIntervalMs: this.updateIntervalMs,
      count: this.entries.length,
      positions: this.entries.map((entry) => propagateSatellite(entry, date)),
    };
  }

  getPosition(id: string, date: Date | null = null): SatellitePosition {
    if (date) {
      const entry = this.entries.find((candidate) => candidate.id === id);

      if (!entry) {
        throw new HttpError(404, `No satellite found for id ${id}`);
      }

      return propagateSatellite(entry, date);
    }

    const position = this.currentPositions.find((candidate) => candidate.id === id);

    if (!position) {
      throw new HttpError(404, `No satellite found for id ${id}`);
    }

    return position;
  }
}
