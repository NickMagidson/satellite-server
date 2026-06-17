import { describe, expect, it } from 'vitest';
import { ValidationError } from '../errors.js';
import { parseOptionalDate } from './time.js';

describe('parseOptionalDate', () => {
  it('returns null when no value is provided', () => {
    expect(parseOptionalDate(undefined)).toBeNull();
  });

  it('parses a valid ISO timestamp', () => {
    const date = parseOptionalDate('2026-01-01T00:00:00Z');

    expect(date?.toISOString()).toBe('2026-01-01T00:00:00.000Z');
  });

  it('rejects empty strings', () => {
    expect(() => parseOptionalDate('')).toThrow(ValidationError);
  });

  it('rejects invalid timestamps', () => {
    expect(() => parseOptionalDate('not-a-date')).toThrow(ValidationError);
  });

  it('rejects non-string values', () => {
    expect(() => parseOptionalDate(['2026-01-01T00:00:00Z'])).toThrow(ValidationError);
  });
});
