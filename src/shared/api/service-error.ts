/** Extra facts some errors carry (ProblemDetails extensions in the HTTP adapters). */
export interface ServiceErrorDetails {
  /** Wrong-code errors: tries left on this code (FR-ACC-02). */
  attemptsLeft?: number;
  /** Lockouts and rate limits: when trying again is allowed (UTC ISO 8601). */
  retryAt?: string;
}

/**
 * A failed service call with the API's stable error code (`<Module>.<Reason>`, 07_API_DESIGN §3).
 * Mock adapters throw it directly; the HTTP adapters will map ProblemDetails bodies to it, so screens
 * branch on `code` the same way whichever adapter is wired in.
 */
export class ServiceError extends Error {
  readonly code: string;
  readonly details: ServiceErrorDetails;

  constructor(code: string, details: ServiceErrorDetails = {}) {
    super(code);
    this.name = 'ServiceError';
    this.code = code;
    this.details = details;
  }
}

export const isServiceError = (error: unknown, code?: string): error is ServiceError =>
  error instanceof ServiceError && (code === undefined || error.code === code);
