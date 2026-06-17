import { describe, expect, it } from 'vitest';
import { ValidationError } from '../errors.js';
import type { ValidationIssue } from '../types.js';
import { validOmm } from '../test/fixtures.js';
import { validateAndNormalizeOmms } from './ommValidation.js';

function expectValidationIssues(error: unknown): ValidationIssue[] {
  expect(error).toBeInstanceOf(ValidationError);
  expect(error).toHaveProperty('details');

  return (error as ValidationError<ValidationIssue[]>).details ?? [];
}

describe('validateAndNormalizeOmms', () => {
  it('accepts a single valid OMM object', () => {
    const result = validateAndNormalizeOmms(validOmm);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      NORAD_CAT_ID: 25544,
      OBJECT_NAME: 'ISS SAMPLE',
    });
  });

  it('accepts an array of OMM objects', () => {
    const result = validateAndNormalizeOmms([validOmm, validOmm]);

    expect(result).toHaveLength(2);
  });

  it('accepts a wrapped satellites array', () => {
    const result = validateAndNormalizeOmms({ satellites: [validOmm] });

    expect(result).toHaveLength(1);
  });

  it('normalizes numeric strings', () => {
    const result = validateAndNormalizeOmms({
      ...validOmm,
      MEAN_MOTION: String(validOmm.MEAN_MOTION),
      NORAD_CAT_ID: String(validOmm.NORAD_CAT_ID),
    });
    const normalizedOmm = result[0];

    expect(normalizedOmm).toBeDefined();
    expect(normalizedOmm?.MEAN_MOTION).toBe(validOmm.MEAN_MOTION);
    expect(normalizedOmm?.NORAD_CAT_ID).toBe('25544');
  });

  it('rejects payloads without OMM records', () => {
    expect(() => validateAndNormalizeOmms(null)).toThrow(ValidationError);
    expect(() => validateAndNormalizeOmms({ satellites: [] })).toThrow(ValidationError);
  });

  it('reports missing NORAD_CAT_ID', () => {
    const { NORAD_CAT_ID, ...payload } = validOmm;

    try {
      validateAndNormalizeOmms(payload);
      throw new Error('Expected validation to fail.');
    } catch (error) {
      const issues = expectValidationIssues(error);
      expect(issues).toContainEqual(
        expect.objectContaining({
          field: 'NORAD_CAT_ID',
        }),
      );
    }
  });

  it('reports invalid epochs and numeric fields', () => {
    try {
      validateAndNormalizeOmms({
        ...validOmm,
        EPOCH: 'not-a-date',
        MEAN_MOTION: 'not-a-number',
      });
      throw new Error('Expected validation to fail.');
    } catch (error) {
      const issues = expectValidationIssues(error);
      expect(issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'EPOCH' }),
          expect.objectContaining({ field: 'MEAN_MOTION' }),
        ]),
      );
    }
  });

  it('reports orbital range violations', () => {
    try {
      validateAndNormalizeOmms({
        ...validOmm,
        MEAN_MOTION: 0,
        ECCENTRICITY: 1,
        INCLINATION: 181,
        RA_OF_ASC_NODE: 360,
      });
      throw new Error('Expected validation to fail.');
    } catch (error) {
      const issues = expectValidationIssues(error);
      expect(issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'MEAN_MOTION' }),
          expect.objectContaining({ field: 'ECCENTRICITY' }),
          expect.objectContaining({ field: 'INCLINATION' }),
          expect.objectContaining({ field: 'RA_OF_ASC_NODE' }),
        ]),
      );
    }
  });
});
