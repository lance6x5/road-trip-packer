/**
 * Share links: the whole trip is packed, JSON-encoded and compressed with
 * lz-string into the URL hash (#/s/<data>). No backend involved.
 */
import LZString from 'lz-string';
import { packTrip, unpackTrip } from './pack.js';

export const SHARE_PREFIX = '#/s/';
/** Above this many characters some chat apps / browsers may truncate links. */
export const LONG_URL_WARN = 2000;
export const VERY_LONG_URL = 8000;

export function encodeTrip(trip) {
  return LZString.compressToEncodedURIComponent(JSON.stringify(packTrip(trip)));
}

export function decodeTrip(data) {
  const json = LZString.decompressFromEncodedURIComponent(data);
  if (!json) throw new Error('This share link is damaged or incomplete.');
  return unpackTrip(JSON.parse(json));
}

/** Absolute share URL for the current page location. */
export function shareUrl(trip, loc = window.location) {
  return `${loc.origin}${loc.pathname}${SHARE_PREFIX}${encodeTrip(trip)}`;
}
