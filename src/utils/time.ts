import { ValidationError } from '../errors.js';

export function parseOptionalDate(value: unknown, fieldName = 'at'): Date | null {
  if (value === undefined) {
    return null;
  }

  if (typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError(`${fieldName} must be a valid ISO timestamp.`);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid ISO timestamp.`);
  }

  return date;
}
