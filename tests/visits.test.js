import { describe, it, expect, vi } from 'vitest';
import { getVisitCount, formatVisits, COUNTER_ORIGIN, COUNTER_KEY, SESSION_FLAG } from '../src/visits.js';

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
}

function okFetch(value) {
  return vi.fn(async () => ({ ok: true, json: async () => ({ value }) }));
}

function env(overrides = {}) {
  return {
    sessionStorage: memoryStorage(),
    navigator: {},
    location: { hostname: 'lance6x5.github.io' },
    ...overrides
  };
}

describe('visit counter', () => {
  it('hits on the first load of a session, then only gets', async () => {
    const e = env({ fetch: okFetch(42) });
    expect(await getVisitCount(e)).toBe(42);
    expect(e.fetch).toHaveBeenLastCalledWith(`${COUNTER_ORIGIN}/hit/${COUNTER_KEY}`, expect.any(Object));
    expect(e.sessionStorage.getItem(SESSION_FLAG)).toBe('1');

    expect(await getVisitCount(e)).toBe(42);
    expect(e.fetch).toHaveBeenLastCalledWith(`${COUNTER_ORIGIN}/get/${COUNTER_KEY}`, expect.any(Object));
  });

  it('sends no query params, credentials or extra headers', async () => {
    const e = env({ fetch: okFetch(1) });
    await getVisitCount(e);
    const [url, opts] = e.fetch.mock.calls[0];
    expect(url).not.toContain('?');
    expect(opts.credentials).toBe('omit');
    expect(opts.cache).toBe('no-store');
    expect(opts.headers).toBeUndefined();
  });

  it('returns null on network errors and non-OK responses', async () => {
    const boom = vi.fn(async () => { throw new Error('offline'); });
    expect(await getVisitCount(env({ fetch: boom }))).toBeNull();

    const notFound = vi.fn(async () => ({ ok: false, status: 404, json: async () => ({ error: 'Key not found' }) }));
    const e = env({ fetch: notFound });
    expect(await getVisitCount(e)).toBeNull();
    expect(e.sessionStorage.getItem(SESSION_FLAG)).toBeNull();

    const junk = vi.fn(async () => ({ ok: true, json: async () => ({}) }));
    expect(await getVisitCount(env({ fetch: junk }))).toBeNull();
  });

  it('never hits when Do Not Track or Global Privacy Control is on', async () => {
    const dnt = env({ fetch: okFetch(7), navigator: { doNotTrack: '1' } });
    expect(await getVisitCount(dnt)).toBe(7);
    expect(dnt.fetch.mock.calls[0][0]).toBe(`${COUNTER_ORIGIN}/get/${COUNTER_KEY}`);

    const gpc = env({ fetch: okFetch(7), navigator: { globalPrivacyControl: true } });
    await getVisitCount(gpc);
    expect(gpc.fetch.mock.calls[0][0]).toBe(`${COUNTER_ORIGIN}/get/${COUNTER_KEY}`);
  });

  it('skips counting entirely on localhost', async () => {
    const e = env({ fetch: okFetch(1), location: { hostname: 'localhost' } });
    expect(await getVisitCount(e)).toBeNull();
    expect(e.fetch).not.toHaveBeenCalled();
  });

  it('still works when sessionStorage throws', async () => {
    const broken = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
    expect(await getVisitCount(env({ fetch: okFetch(5), sessionStorage: broken }))).toBe(5);
  });

  it('formats the count', () => {
    expect(formatVisits(12345, 'en-US')).toBe('12,345 visits');
    expect(formatVisits(1, 'en-US')).toBe('1 visit');
  });
});
