import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';
import { getApiErrorCode, getApiErrorMessage, getApiErrorMessages } from './api-error';

const config = { headers: {} } as InternalAxiosRequestConfig;

/** An axios error carrying a response, as the API returns it */
function apiError(status: number, data: unknown) {
  const response = { status, data, statusText: '', headers: {}, config } as AxiosResponse;
  return new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, config, null, response);
}

describe('getApiErrorCode', () => {
  it('reads the code from a ProblemDetails title', () => {
    expect(getApiErrorCode(apiError(409, { title: 'Appointment.SlotAlreadyBooked' }))).toBe('Appointment.SlotAlreadyBooked');
  });

  it('reads the code from an errors key when the title is generic', () => {
    const error = apiError(400, { title: 'One or more validation errors occurred.', errors: { 'Auth.EmailAlreadyExists': ['Taken'] } });
    expect(getApiErrorCode(error)).toBe('Auth.EmailAlreadyExists');
  });

  it('is undefined for non-API errors', () => {
    expect(getApiErrorCode(new Error('boom'))).toBeUndefined();
  });
});

describe('getApiErrorMessage', () => {
  it('maps known codes to friendly text instead of showing the code', () => {
    expect(getApiErrorMessage(apiError(401, { title: 'Auth.InvalidCredentials' }), 'fallback')).toBe(
      'Incorrect email or password.'
    );
  });

  it('uses the detail for an unknown code', () => {
    expect(getApiErrorMessage(apiError(400, { title: 'Some.NewCode', detail: 'Something specific' }), 'fallback')).toBe(
      'Something specific'
    );
  });

  it('prefers the detail for codes whose detail is more useful', () => {
    expect(
      getApiErrorMessage(apiError(400, { title: 'Auth.RegistrationFailed', detail: 'Passwords must have a digit.' }), 'fallback')
    ).toBe('Passwords must have a digit.');
  });

  it('lists every validation message', () => {
    const error = apiError(400, {
      title: 'One or more validation errors occurred.',
      errors: { Email: ['Email is required.'], Password: ['Too short.', 'Needs a digit.'] },
    });
    expect(getApiErrorMessages(error, 'fallback')).toEqual(['Email is required.', 'Too short.', 'Needs a digit.']);
  });

  it('explains a network failure', () => {
    const error = new AxiosError('Network Error', AxiosError.ERR_NETWORK, config);
    expect(getApiErrorMessage(error, 'fallback')).toMatch(/could not reach the server/i);
  });

  it('explains a bare 403 and falls back otherwise', () => {
    expect(getApiErrorMessage(apiError(403, ''), 'fallback')).toBe('You do not have permission to do that.');
    expect(getApiErrorMessage(apiError(500, ''), 'fallback')).toBe('fallback');
    expect(getApiErrorMessage(new Error('boom'), 'fallback')).toBe('fallback');
  });
});
