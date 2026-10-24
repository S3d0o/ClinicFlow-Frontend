import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { isServiceError } from '@/shared/api/service-error';

// Keys are built from runtime values (an error code, a zod message), so they're checked with
// `i18n.exists` instead of the compile-time key type; the cast only satisfies that type.
type DynamicKey = 'errors.generic';

/**
 * A sentence for a failed call: the translation of its `ServiceError` code (`common:errors.<code>`),
 * filled with the error's details, or `fallback` (default: a generic message) for unknown codes and
 * network failures. Never shows a raw code.
 */
export function useErrorMessage() {
  const { t, i18n } = useTranslation('common');
  return useCallback(
    (error: unknown, fallback?: string) => {
      if (isServiceError(error)) {
        const key = `errors.${error.code}`;
        if (i18n.exists(key, { ns: 'common' })) return t(key as DynamicKey, { ...error.details });
      }
      return fallback ?? t('errors.generic');
    },
    [t, i18n]
  );
}

/** Translates a validation message: zod schemas use `common:validation.*` keys as messages. */
export function useValidationMessage() {
  const { t } = useTranslation('common');
  return useCallback(
    (message: string | undefined, values?: Record<string, unknown>) =>
      message ? t(message as DynamicKey, values) : undefined,
    [t]
  );
}
