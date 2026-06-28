export function encodeStrategy(name: string, code: string): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify({ name, code }))))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function decodeStrategy(encoded: string): { name: string; code: string } {
  const padded = encoded + '==='.slice(0, (4 - (encoded.length % 4)) % 4);
  const b64    = padded.replace(/-/g, '+').replace(/_/g, '/');
  const obj    = JSON.parse(decodeURIComponent(escape(atob(b64))));
  if (typeof obj?.name !== 'string' || typeof obj?.code !== 'string')
    throw new Error('Invalid strategy share link');
  return { name: obj.name, code: obj.code };
}

export function strategyShareUrl(name: string, code: string): string {
  const base = window.location.origin + window.location.pathname;
  return `${base}?s=${encodeStrategy(name, code)}`;
}
