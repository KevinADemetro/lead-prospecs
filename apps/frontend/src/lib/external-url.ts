const SAFE_PROTOCOLS = new Set(['http:', 'https:']);

/** Returns an absolute http(s) URL, or null for empty/unsafe values (e.g. `javascript:`). */
export function toExternalUrl(value?: string | null): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    return SAFE_PROTOCOLS.has(url.protocol) && url.hostname.includes('.') ? url.href : null;
  } catch {
    return null;
  }
}

export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
}

type MapsTarget = {
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  googleMapsUrl?: string | null;
  googlePlaceId?: string | null;
};

/** Prefers the stored Maps URL; falls back to a Maps search link (no API call). */
export function googleMapsLink(target: MapsTarget): string | null {
  const stored = toExternalUrl(target.googleMapsUrl);
  if (stored) return stored;
  const query = [target.name, target.address, target.city, target.state].filter(Boolean).join(', ');
  const params = new URLSearchParams({ api: '1', query });
  if (target.googlePlaceId) {
    params.set('query_place_id', target.googlePlaceId);
  } else if (!target.address && !target.city) {
    return null;
  }
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

/** Builds a wa.me link, assuming Brazil (+55) for 10–11 digit numbers. */
export function whatsappLink(phone?: string | null): string | null {
  let digits = (phone ?? '').replace(/\D/g, '').replace(/^0+/, '');
  if (digits.length === 10 || digits.length === 11) {
    digits = `55${digits}`;
  }
  return digits.length >= 12 && digits.length <= 15 ? `https://wa.me/${digits}` : null;
}
