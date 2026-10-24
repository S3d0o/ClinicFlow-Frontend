// Links that hand off to the phone or maps app.

/** `tel:` link for an E.164 number. */
export const telHref = (e164: string) => `tel:${e164}`;

/** A maps search for an address (opens the maps app on phones). */
export const directionsHref = (address: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
