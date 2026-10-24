// Token payloads of the auth endpoints (API contract §2). Only the HTTP client and the future
// HTTP auth adapter use them; the app works with `features/auth/model` types.

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  email: string;
  fullName: string;
  role: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}
