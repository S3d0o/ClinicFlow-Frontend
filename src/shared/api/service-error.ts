/**
 * A failed service call with the API's stable error code (`<Module>.<Reason>`, 07_API_DESIGN §3).
 * Mock adapters throw it directly; the HTTP adapters will map ProblemDetails bodies to it, so screens
 * branch on `code` the same way whichever adapter is wired in.
 */
export class ServiceError extends Error {
  readonly code: string;

  constructor(code: string, message = code) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
  }
}

export const isServiceError = (error: unknown, code?: string): error is ServiceError =>
  error instanceof ServiceError && (code === undefined || error.code === code);
