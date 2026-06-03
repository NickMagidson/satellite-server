export class HttpError<TDetails = unknown> extends Error {
  readonly statusCode: number;
  readonly details?: TDetails;

  constructor(statusCode: number, message: string, details?: TDetails) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;

    if (details !== undefined) {
      this.details = details;
    }
  }
}

export class ValidationError<TDetails = unknown> extends HttpError<TDetails> {
  constructor(message: string, details?: TDetails) {
    super(400, message, details);
    this.name = 'ValidationError';
  }
}
