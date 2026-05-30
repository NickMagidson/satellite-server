import { ValidationError } from '../errors.js';
import { REQUIRED_NUMBER_FIELDS, type NormalizedOmmRecord, type ValidationIssue } from '../types.js';

const REQUIRED_STRING_FIELDS = ['EPOCH'] as const;
const OPTIONAL_STRING_FIELDS = ['OBJECT_ID', 'OBJECT_NAME', 'CLASSIFICATION_TYPE'] as const;

function asArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (isObject(payload) && Array.isArray(payload.satellites)) {
    return payload.satellites;
  }

  if (payload && typeof payload === 'object') {
    return [payload];
  }

  return [];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    return Number(value);
  }

  return Number.NaN;
}

function isIdentifierValue(value: unknown): value is string | number {
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }

  return typeof value === 'string' && value.trim() !== '';
}

function addRangeError(
  errors: ValidationIssue[],
  index: number,
  field: string,
  message: string,
): void {
  errors.push({
    index,
    field,
    message,
  });
}

function validateRanges(
  omm: NormalizedOmmRecord,
  index: number,
  errors: ValidationIssue[],
): void {
  if (omm.MEAN_MOTION <= 0) {
    addRangeError(errors, index, 'MEAN_MOTION', 'MEAN_MOTION must be greater than 0.');
  }

  if (omm.ECCENTRICITY < 0 || omm.ECCENTRICITY >= 1) {
    addRangeError(errors, index, 'ECCENTRICITY', 'ECCENTRICITY must be >= 0 and < 1.');
  }

  if (omm.INCLINATION < 0 || omm.INCLINATION > 180) {
    addRangeError(errors, index, 'INCLINATION', 'INCLINATION must be between 0 and 180 degrees.');
  }

  for (const field of ['RA_OF_ASC_NODE', 'ARG_OF_PERICENTER', 'MEAN_ANOMALY'] as const) {
    if (omm[field] < 0 || omm[field] >= 360) {
      addRangeError(errors, index, field, `${field} must be >= 0 and < 360 degrees.`);
    }
  }
}

export function validateAndNormalizeOmms(payload: unknown): NormalizedOmmRecord[] {
  const omms = asArray(payload);
  const errors: ValidationIssue[] = [];

  if (omms.length === 0) {
    throw new ValidationError('OMM payload must be an object, an array, or { "satellites": [...] }.');
  }

  const normalized = omms.map((omm, index) => {
    if (!isObject(omm)) {
      errors.push({ index, message: 'Each OMM must be an object.' });
      return omm;
    }

    const next: Record<string, unknown> = { ...omm };
    let hasFieldValidationError = false;

    for (const field of REQUIRED_STRING_FIELDS) {
      if (typeof next[field] !== 'string' || next[field].trim() === '') {
        errors.push({ index, field, message: `${field} is required.` });
        hasFieldValidationError = true;
      }
    }

    for (const field of OPTIONAL_STRING_FIELDS) {
      if (next[field] !== undefined && (typeof next[field] !== 'string' || next[field].trim() === '')) {
        errors.push({ index, field, message: `${field} must be a non-empty string when provided.` });
        hasFieldValidationError = true;
      }
    }

    if (typeof next.EPOCH === 'string' && Number.isNaN(new Date(next.EPOCH).getTime())) {
      errors.push({ index, field: 'EPOCH', message: 'EPOCH must be a valid timestamp.' });
      hasFieldValidationError = true;
    }

    if (!isIdentifierValue(next.NORAD_CAT_ID)) {
      errors.push({
        index,
        field: 'NORAD_CAT_ID',
        message: 'NORAD_CAT_ID is required because satellite.js uses it to create a satrec.',
      });
      hasFieldValidationError = true;
    }

    for (const field of REQUIRED_NUMBER_FIELDS) {
      const value = normalizeNumber(next[field]);

      if (!Number.isFinite(value)) {
        errors.push({ index, field, message: `${field} must be a finite number.` });
        hasFieldValidationError = true;
        continue;
      }

      next[field] = value;
    }

    if (!hasFieldValidationError) {
      validateRanges(next as NormalizedOmmRecord, index, errors);
    }

    return next;
  });

  if (errors.length > 0) {
    throw new ValidationError('Invalid OMM payload.', errors);
  }

  return normalized as NormalizedOmmRecord[];
}
