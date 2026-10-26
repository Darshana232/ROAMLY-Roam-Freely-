// An error we expect and want to show the client (bad input, not found,
// forbidden...). Anything that is not an AppError is treated as a bug and
// returned as a generic 500 so internals never leak.
export class AppError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}
