/**
 * Anonymous visit counter via the open-source Abacus service
 * (https://github.com/JasonLovesDoggo/abacus). No signup, no key, no cookies.
 *
 * The first page load per browser session calls /hit (increments); later loads
 * call /get (read only). Nothing about the user or their trips is sent: no
 * query params, no extra headers, no credentials. Skipped on localhost, and
 * Do Not Track / Global Privacy Control only read the count, never add to it.
 *
 * Fails silently: any error, timeout, offline or non-OK response returns null.
 */
export const COUNTER_ORIGIN = 'https://abacus.jasoncameron.dev';
export const COUNTER_KEY = 'lance6x5.github.io/road-trip-packer';
export const SESSION_FLAG = 'road-trip-packer:visit-counted';
const TIMEOUT_MS = 4000;
const DEV_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

function safeGet(storage, key) {
  try { return storage ? storage.getItem(key) : null; } catch { return null; }
}

function safeSet(storage, key, value) {
  try { if (storage) storage.setItem(key, value); } catch { /* storage unavailable */ }
}

/** True when the browser asks not to be tracked. */
export function privacyOptOut(nav) {
  if (!nav) return false;
  return nav.doNotTrack === '1' || nav.globalPrivacyControl === true;
}

/**
 * Count this visit (once per session) and return the total, or null.
 * @param {object} [env] injectable globals, for tests
 * @returns {Promise<number|null>}
 */
export async function getVisitCount(env = {}) {
  const g = typeof globalThis === 'undefined' ? {} : globalThis;
  const fetchFn = env.fetch ?? g.fetch;
  const nav = env.navigator ?? g.navigator;
  const loc = env.location ?? g.location;
  let storage = env.sessionStorage;
  if (storage === undefined) {
    try { storage = g.sessionStorage; } catch { storage = null; }
  }

  if (typeof fetchFn !== 'function') return null;
  if (loc && DEV_HOSTS.has(loc.hostname)) return null;

  const counted = safeGet(storage, SESSION_FLAG) === '1';
  const action = counted || privacyOptOut(nav) ? 'get' : 'hit';

  const ctrl = typeof AbortController === 'undefined' ? null : new AbortController();
  const timer = ctrl ? setTimeout(() => ctrl.abort(), TIMEOUT_MS) : null;
  try {
    const res = await fetchFn(`${COUNTER_ORIGIN}/${action}/${COUNTER_KEY}`, {
      method: 'GET',
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      signal: ctrl?.signal
    });
    if (!res || !res.ok) return null;
    const data = await res.json();
    const value = Number(data?.value);
    if (!Number.isFinite(value) || value < 0) return null;
    if (action === 'hit') safeSet(storage, SESSION_FLAG, '1');
    return value;
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** "12,345 visits" (or "1 visit") in the user's locale. */
export function formatVisits(n, locale) {
  const num = new Intl.NumberFormat(locale).format(n);
  return `${num} ${n === 1 ? 'visit' : 'visits'}`;
}

/** Fill the footer counter element; it stays hidden unless a value arrives. */
export async function initVisits(el) {
  if (!el) return;
  const n = await getVisitCount();
  if (n === null) return;
  el.textContent = formatVisits(n);
  el.hidden = false;
}
