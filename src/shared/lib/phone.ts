// Egyptian mobile numbers (FR-ACC-01): `01[0125]` + 8 digits locally, stored and returned as E.164
// (`+201…`, 07_API_DESIGN §3).

const LOCAL_MOBILE = /^01[0125]\d{8}$/;

/** "010 1234 5678", "+20 10 1234 5678" or "201012345678" → "+201012345678"; anything else → null. */
export function toE164EgyptianMobile(input: string): string | null {
  let digits = input.replace(/[\s\-()]/g, '');
  if (digits.startsWith('+20')) digits = `0${digits.slice(3)}`;
  else if (digits.startsWith('0020')) digits = `0${digits.slice(4)}`;
  else if (digits.startsWith('20') && digits.length === 12) digits = `0${digits.slice(2)}`;
  return LOCAL_MOBILE.test(digits) ? `+20${digits.slice(1)}` : null;
}

export const isEgyptianMobile = (input: string) => toE164EgyptianMobile(input) !== null;

/** "+201012345678" → "+20 10•• ••• 5678", for "we sent a code to …" messages. */
export function maskPhone(e164: string): string {
  const local = e164.replace(/^\+20/, '');
  if (local.length !== 10) return e164;
  return `+20 ${local.slice(0, 2)}•• ••• ${local.slice(-4)}`;
}
